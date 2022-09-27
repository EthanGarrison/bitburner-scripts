import { buildPath, buildServerTree } from "scripts/ns-utils"
import * as iter from "scripts/utils/iterable"

export async function main(ns: typeof NS) {
    const [target] = ns.args

    if(typeof target != "string") throw "No target was given!"

    const serverTree = buildServerTree(ns)
    const pathToTarget = buildPath(serverTree, target)
    iter.foreach(ns.singularity.connect)(pathToTarget)
}