import { NS } from "@ns"

import { compose } from "scripts/utils/fn"
import * as iter from "scripts/utils/iterable"
import { getProfitableServers } from "scripts/utils/ns-utils.js"

export async function main(ns: NS) {
    compose(
        iter.foreach(_ => ns.tprint(_)),
        iter.take(10)
    )(getProfitableServers(ns))
}
