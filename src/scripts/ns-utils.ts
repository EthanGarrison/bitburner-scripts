import * as fn from "scripts/utils/fn"
import * as iter from "scripts/utils/iterable"

export interface ServerTree<T> {
    node: T
    leaves: () => ServerTree<T>[]
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
