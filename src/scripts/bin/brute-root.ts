import * as iter from "scripts/utils/iterable"
import * as fn from "scripts/utils/fn"

import { genDeepScan, getRootAccess } from "scripts/utils/ns-utils"

export async function main(ns: typeof NS) {
    fn.compose(iter.consume, iter.map((server: string) => getRootAccess(ns, server)))(genDeepScan(ns))
}
