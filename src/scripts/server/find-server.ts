import { isDefined } from "scripts/utils/type"
import { buildServerTree, buildPath } from "scripts/ns-utils"
import * as iter from "scripts/utils/iterable"

export async function main(ns: typeof NS) {
    const [target] = ns.args

    if(!isDefined(target)) throw "No target was given!"

    const serverTree = buildServerTree(ns)
    const pathToTarget = buildPath(serverTree, `${target}`)
    const connectStr = iter.foldLeft("")((acc, server) => acc + `connect ${server};`)(pathToTarget)
    ns.tprint(connectStr)
}
