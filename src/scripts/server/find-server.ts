import { isDefined } from "scripts/utils/type"
import { buildServerTree, ServerTree } from "scripts/ns-utils"
import * as gen from "scripts/utils/generator"

function buildPath<T>(tree: ServerTree<T>, target: T): T[] {
    function recurse(current: ServerTree<T>): T[] {
        if(current.node == target) return [current.node]
        else {
            for(const child of current.leaves()) {
                if(child.node == target) return [child.node]
                const possiblePath = recurse(child)
                if(possiblePath.length > 0) return [child.node, ...possiblePath]
            }
            return []
        }
    }

    return recurse(tree)
}

export async function main(ns: typeof NS) {
    const [target] = ns.args

    if(!isDefined(target)) throw "No target was given!"

    const serverTree = buildServerTree(ns)
    const pathToTarget = buildPath(serverTree, `${target}`)
    const connectStr = gen.foldLeft("")((acc, server) => acc + `connect ${server};`)(pathToTarget)
    ns.tprint(connectStr)
}
