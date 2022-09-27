import * as typeCheck from "scripts/utils/type"
import * as iter from "scripts/utils/iterable"
import * as fn from "scripts/utils/fn"

import { genDeepScan } from "scripts/ns-utils.js"

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

export async function main(ns: typeof NS) {
    getProfitableServers(ns)
}
