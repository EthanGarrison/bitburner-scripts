import * as fn from "scripts/utils/fn"
import * as iter from "scripts/utils/iterable"
import * as typeCheck from "scripts/utils/type"

export interface ServerTree<T> {
    node: T
    leaves: () => ServerTree<T>[]
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
const MIN_WEAKEN_CYCLE = ((HACK_SECURITY_DELTA + GROW_SECURITY_DELTA) / WEAKEN_SECURITY_DELTA)

function serverRank(ns: typeof NS, server: string): ServerRank | null {
    const hackFormulas = ns.formulas.hacking
    const serverInfo = ns.getServer(server)
    const playerInfo = ns.getPlayer()
    if (!serverInfo.hasAdminRights || serverInfo.requiredHackingSkill > playerInfo.skills.hacking) return null

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
    const totalWeakenTime = weakenTime * MIN_WEAKEN_CYCLE

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
	const seen = new Set([root])
	function recurse(current: string) {
		const children = ns.scan(current)
		const genLeaves: (children: string[]) => ServerTree<string>[] = fn.compose(
			iter.toArray,
			iter.map((child: string) => recurse(child)),
			iter.filter((child: string) => {
				const notSeen = !seen.has(child)
				if(notSeen) seen.add(child)
				return notSeen
			})
		)

		return { "node": current, leaves() { return genLeaves(children) } }
	}
	return recurse(root)
}

export function buildPath<T>(tree: ServerTree<T>, target: T): T[] {
	const seen = new Set([tree.node])
    function recurse(current: ServerTree<T>): T[] {
        if(current.node == target) return [current.node]
        else {
            for(const child of current.leaves()) {
				if(seen.has(child.node)) continue
				seen.add(child.node)
                if(child.node == target) return [child.node]
                const possiblePath = recurse(child)
                if(possiblePath.length > 0) return [child.node, ...possiblePath]
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
        iter.filter(typeCheck.isDefined),
        iter.map((_: string) => serverRank(ns, _)),
        iter.filter((server: string) => !(server == "home" || server == "darkweb"))
    )(genDeepScan(ns, "home"))
}

