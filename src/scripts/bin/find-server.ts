import { NS } from "NetscriptDefinitions"
import { isDefined } from "scripts/utils/type"
import { buildServerTree, buildPath } from "scripts/utils/ns-utils"
import * as iter from "scripts/utils/iterable"

export async function main(ns: NS) {
    const [target] = ns.args
    if(!isDefined(target)) throw "No target was given!"
    ns.tprint(iter.foldLeft("")((acc, server) => acc + `connect ${server};`)(buildPath(buildServerTree(ns, "home"), `${target}`)))
}
