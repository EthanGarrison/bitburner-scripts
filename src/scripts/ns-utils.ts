import * as fn from "scripts/utils/fn"
import * as gen from "scripts/utils/generator"

interface ServerTree<T> {
    node: T
    leaves: () => ServerTree<T>[]
}

/**
 * Attempts to gain root access through brute-force attempts of each port script
 */
 function getRootAccess(ns: typeof NS, target: string) {
	if (ns.hasRootAccess(target)) return true
	const cracks = [ns.brutessh, ns.relaysmtp, ns.ftpcrack, ns.sqlinject, ns.httpworm, ns.nuke]
	for (const fn of cracks) {
		try { fn(target) }
		catch { }
	}
	return ns.hasRootAccess(target)
}

function buildServerTree(ns: typeof NS, root = "home"): ServerTree<string> {
	const seen = new Set([root])
	function recurse(current: string) {
		const children = ns.scan(current)
		const genLeaves: (children: string[]) => ServerTree<string>[] = fn.compose(
			gen.map((child: string) => recurse(child)),
			gen.filter((child: string) => {
				const notSeen = !seen.has(child)
				if(notSeen) seen.add(child)
				return notSeen
			})
		)
		return { "node": current, leaves: () => genLeaves(children) }
	}
	return recurse(root)
}

/**
 * Recursively scans every server in the tree, starting at the given root
 */
function* genDeepScan(ns: typeof NS, root = "home") {
	const serverSet = new Set([root])
	yield root
	function* recurse(current) {
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

export { getRootAccess, genDeepScan, buildServerTree, ServerTree }
