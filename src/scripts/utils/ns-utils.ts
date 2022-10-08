import * as fn from "scripts/utils/fn"
import * as iter from "scripts/utils/iterable"
import * as typeCheck from "scripts/utils/type"

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

const HACK_SECURITY_DELTA = 0.002
const GROW_SECURITY_DELTA = 0.004
const WEAKEN_SECURITY_DELTA = 0.05

/**
 * Ranks given server based on the overall calculated potential hacking revenue
 * 
 * Rank is weighted and filtered based on player skills, meaning that the rank will change overtime
 */
function serverRank(ns: typeof NS, server: string): ServerRank {
    const hackFormulas = ns.formulas.hacking

    // Setting the hackDifficulty to the minimum, as the formulas depend on it
    // By not doing this, servers that have been worked on previously are weighted favorably
    const serverInfo = ns.getServer(server)
    serverInfo.hackDifficulty = serverInfo.minDifficulty
    serverInfo.moneyAvailable = serverInfo.moneyMax

    const playerInfo = ns.getPlayer()
    if (!serverInfo.hasAdminRights || serverInfo.requiredHackingSkill > playerInfo.skills.hacking)
        return { "name": server, "hackMoney": 0, "loopTime": Infinity, "rank": 0 }

    // Assume a single hack
    const hackTime = hackFormulas.hackTime(serverInfo, playerInfo)

    // Calc time until grow recovers
    const minGrowTime = hackFormulas.growTime(serverInfo, playerInfo)
    const hackPercent = hackFormulas.hackPercent(serverInfo, playerInfo)
    const growPercent = hackFormulas.growPercent(serverInfo, 1, playerInfo, 1)
    const growCount = hackPercent / (growPercent - 1)
    const totalGrowTime = minGrowTime * growCount

    // Calc security cost
    const weakenTime = hackFormulas.weakenTime(serverInfo, playerInfo)
    const totalWeakenTime = weakenTime * ((HACK_SECURITY_DELTA + GROW_SECURITY_DELTA * growCount) / WEAKEN_SECURITY_DELTA)

    const hackMoney = serverInfo.moneyMax * hackPercent
    const totalLoopTime = (hackTime + totalGrowTime + totalWeakenTime) / 1000

    return { "name": server, "loopTime": totalLoopTime, hackMoney, "rank": hackMoney / totalLoopTime }
}

/**
 * Attempts to gain root access through brute-force attempts of each port script
 */
export function getRootAccess(ns: typeof NS, target: string) {
    if (ns.hasRootAccess(target)) return true
    const cracks = [ns.brutessh, ns.relaysmtp, ns.ftpcrack, ns.sqlinject, ns.httpworm, ns.nuke]
    for (const fn of cracks) {
        try { fn(target) }
        catch { }
    }
    return ns.hasRootAccess(target)
}

export function buildServerTree(ns: typeof NS, root: string): ServerTree<string> {
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
export function* genDeepScan(ns: typeof NS, root = "home") {
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

export function getProfitableServers(ns: typeof NS, count: number = 10): ServerRank[] {
    return fn.compose(
        iter.foreach(_ => ns.tprint(_)),
        iter.take(count),
        iter.sort((l: ServerRank, r: ServerRank) => r.rank - l.rank),
        iter.filter((sr: ServerRank) => sr.rank > 0),
        iter.map((_: string) => serverRank(ns, _)),
        iter.filter((server: string) => !(server == "home" || server == "darkweb"))
    )(genDeepScan(ns, "home"))
}
