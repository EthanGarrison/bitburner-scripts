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

function serverRank(ns: typeof NS, server: string): ServerRank | null {
	const serverInfo = ns.getServer(server)
    if(!serverInfo.hasAdminRights || serverInfo.requiredHackingSkill > ns.getPlayer().skills.hacking) return null

    // Assume a single hack
	const hackTime = ns.getHackTime(server)

	// Calc time until grow recovers
	const minGrowTime = ns.getGrowTime(server)
	const hackPercent = ns.hackAnalyze(server)
	const growCount = ns.growthAnalyze(server, 1 + hackPercent)
	const totalGrowTime = minGrowTime * growCount

	// Calc security cost
	const weakenTime = ns.getWeakenTime(server)
	const hackSecurity = ns.hackAnalyzeSecurity(1, server)
	const growSecurity = ns.growthAnalyzeSecurity(1, server, 1)
	const weakenAmount = ns.weakenAnalyze(1)
	const totalWeakenTime = weakenTime * ((hackSecurity + growSecurity) / weakenAmount)

	const serverMaxMoney = ns.getServerMaxMoney(server)
	const hackMoney = serverMaxMoney * hackPercent
	const totalLoopTime = hackTime + totalGrowTime + totalWeakenTime

	return { "name": server, "loopTime": totalLoopTime / 1000, hackMoney, "rank": (hackMoney * 0.5) + (totalLoopTime * 0.8) }
}

export async function main(ns: typeof NS) {
	fn.compose(
		iter.foreach(_ => ns.tprint(_)),
        iter.take(10),
		iter.sort((l: ServerRank, r: ServerRank) => r.rank - l.rank),
		iter.filter(typeCheck.isDefined),
		iter.map((_: string) => serverRank(ns, _)),
		iter.filter((server: string) => !(server == "home" || server == "darkweb"))
	)(genDeepScan(ns, "home"))
}
