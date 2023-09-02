import { NS, Server, Player, ScriptArg } from "@ns"
import * as fn from "scripts/utils/fn"
import * as iter from "scripts/utils/iterable"
import * as typeCheck from "scripts/utils/type"
import { home, simpleHackScript } from "scripts/utils/constants"

export interface ServerTree<T> {
    node: T
    leaves: () => Iterable<ServerTree<T>>
}

interface ServerRank {
    name: string
    loopTime: number
    hackMoney: number
    rank: number
}

export interface HGWThreadCount {
    hack: number,
    grow: number,
    weaken: number
}

export interface ServerThread {
    server: string,
    thread: number
}

const HACK_SECURITY_DELTA = 0.002
const GROW_SECURITY_DELTA = 0.004
const WEAKEN_SECURITY_DELTA = 0.05
function weakenCount(growCount: number) { return ((HACK_SECURITY_DELTA + GROW_SECURITY_DELTA * growCount) / WEAKEN_SECURITY_DELTA) }

/**
 * Ranks given server based on the overall calculated potential hacking revenue
 * 
 * Rank is weighted and filtered based on player skills, meaning that the rank will change overtime
 */
function serverRank(ns: NS, server: string): ServerRank {
    const hackFormulas = ns.formulas.hacking

    // Setting the hackDifficulty to the minimum, as the formulas depend on it
    // By not doing this, servers that have been worked on previously are weighted favorably
    const serverInfo = ns.getServer(server)
    serverInfo.hackDifficulty = serverInfo.minDifficulty
    serverInfo.moneyAvailable = serverInfo.moneyMax

    const playerInfo = ns.getPlayer()
    if (!serverInfo.hasAdminRights || (serverInfo.requiredHackingSkill ?? Infinity) > playerInfo.skills.hacking)
        return { "name": server, "hackMoney": 0, "loopTime": Infinity, "rank": 0 }

    const hgwThreadCount = getHGWCount(ns, serverInfo, playerInfo)
    // Assume a single hack
    const hackTime = hackFormulas.hackTime(serverInfo, playerInfo)

    // Calc time until grow recovers
    const minGrowTime = hackFormulas.growTime(serverInfo, playerInfo)
    const totalGrowTime = minGrowTime * hgwThreadCount.grow

    // Calc security cost
    const weakenTime = hackFormulas.weakenTime(serverInfo, playerInfo)
    const totalWeakenTime = weakenTime * weakenCount(hgwThreadCount.grow)

    const hackPercent = hackFormulas.hackPercent(serverInfo, playerInfo)
    const hackMoney = (serverInfo.moneyMax ?? 0) * hackPercent
    const totalLoopTime = (hackTime + totalGrowTime + totalWeakenTime) / 1000

    return { "name": server, "loopTime": totalLoopTime, hackMoney, "rank": hackMoney / totalLoopTime }
}

/**
 * Attempts to gain root access through brute-force attempts of each port script
 */
export function getRootAccess(ns: NS, target: string) {
    if (ns.hasRootAccess(target)) return true
    const cracks = [ns.brutessh, ns.relaysmtp, ns.ftpcrack, ns.sqlinject, ns.httpworm, ns.nuke]
    for (const fn of cracks) {
        try { fn(target) }
        catch { }
    }
    return ns.hasRootAccess(target)
}

export function buildServerTree(ns: NS, root: string): ServerTree<string> {
    function recurse(current: string, seen = new Set([root])) {
        const genLeaves: (children: string[]) => Iterable<ServerTree<string>> = fn.compose(
            iter.toArray,
            iter.map((child: string) => recurse(child, seen)),
            iter.filter((child: string) => {
                const notSeen = !seen.has(child)
                if (notSeen) seen.add(child)
                return notSeen
            })
        )
        let _leaves: Iterable<ServerTree<string>>
        return {
            "node": current,
            leaves() {
                if (!typeCheck.isDefined(_leaves)) _leaves = genLeaves(ns.scan(current))
                return _leaves
            }
        }
    }
    return recurse(root)
}

export function buildPath<T>(tree: ServerTree<T>, target: T): T[] {
    const seen = new Set([tree.node])
    function recurse(current: ServerTree<T>): T[] {
        if (current.node == target) return [current.node]
        else {
            for (const child of current.leaves()) {
                if (seen.has(child.node)) continue
                seen.add(child.node)
                if (child.node == target) return [child.node]
                const possiblePath = recurse(child)
                if (possiblePath.length > 0) return [child.node, ...possiblePath]
            }
            return []
        }
    }

    return recurse(tree)
}

/**
 * Recursively scans every server in the tree, starting at the given root
 */
export function* genDeepScan(ns: NS, root = home) {
    const serverSet = new Set([root])
    yield root
    function* recurse(current: string): Generator<string, void, void> {
        const found = ns.scan(current)
        for (const server of found) {
            if (serverSet.has(server)) continue;

            serverSet.add(server)
            yield server
            yield* recurse(server)
        }
    }
    yield* recurse(root)
}

export function getProfitableServers(ns: NS, count: number = 10): ServerRank[] {
    return fn.compose(
        iter.foreach(_ => ns.tprint(_)),
        iter.take(count),
        iter.sort((l: ServerRank, r: ServerRank) => r.rank - l.rank),
        iter.filter((sr: ServerRank) => sr.rank > 0),
        iter.map((_: string) => serverRank(ns, _)),
        iter.filter((server: string) => !(server == "home" || server == "darkweb"))
    )(genDeepScan(ns, "home"))
}

/**
 * Calculates the thread count necessary for a full hack-grow-weaken loop
 * @param ns Netscript
 * @param server Server target
 * @param player Player info
 * @returns The thread count ratios for hack-grow-weaken
 */
export function getHGWCount(ns: NS, server: Server, player: Player): HGWThreadCount {
    const hackFormulas = ns.formulas.hacking

    // Setting the hackDifficulty to the minimum, as the formulas depend on it
    // By not doing this, servers that have been worked on previously are weighted favorably
    server.hackDifficulty = server.minDifficulty

    // Calc time until grow recovers
    const hackPercent = hackFormulas.hackPercent(server, player)
    const growPercent = hackFormulas.growPercent(server, 1, player, 1)
    const growCount = hackPercent / (growPercent - 1)

    return { hack: 1, grow: growCount, weaken: weakenCount(growCount) }
}

/**
 * Calculates the number of threads available on a server based on the amount of memory the given script requires
 * 
 * @param ns Netscript
 * @param killRunning Kill any running scripts on the server before thread calculations
 * @param script The expected script that will be run.  Necessary for thread calculations
 * @param scriptArgs The expected args for the script.  Necessary for testing if script is already running on server
 * @returns 
 */
export function getServerThreadsAvailable(
    ns: NS,
    killRunning = false,
    script = simpleHackScript,
    ...scriptArgs: (string | number | boolean)[]): (_: Iterable<string>) => Iterable<ServerThread> {

    return fn.compose(
        iter.filter<{ threads: number }>(({ threads }) => threads > 0), // Skip if not enough available threads
        iter.map((server: string) => {
            if (killRunning) ns.killall(server)
            const serverMem = ns.getServerMaxRam(server) - ns.getServerUsedRam(server)
            const threads = Math.max(Math.floor(serverMem / ns.getScriptRam(script, home)), 0)
            return { server, threads }
        }),
        iter.filter((server: string) => server != home && ns.hasRootAccess(server) && !ns.isRunning(script, server, ...scriptArgs)),
    )
}
