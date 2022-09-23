import * as iter from "scripts/utils/iterable"
import * as fn from "scripts/utils/fn"

import { genDeepScan, getRootAccess } from "scripts/ns-utils"

/**
 * @param {NS} ns 
 */
export async function main(ns) {
    const serverList = genDeepScan(ns, "home")

    fn.compose(
        iter.consume,
        iter.map((server: string) => getRootAccess(ns, server))
    )(serverList)
}
