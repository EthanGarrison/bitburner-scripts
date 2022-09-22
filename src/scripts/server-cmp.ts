import * as typeCheck from "scripts/utils/type"
import * as gen from "scripts/utils/generator"
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
    if(!serverInfo.hasAdminRights || serverInfo.requiredHackingSkill >= ns.getPlayer().skills.hacking) return null

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
		gen.foreach(_ => ns.tprint(_)),
        gen.take(10),
		gen.sort((l: ServerRank, r: ServerRank) => r.rank - l.rank),
		gen.filter(typeCheck.isDefined),
		gen.map((_: string) => serverRank(ns, _)),
		gen.filter((server: string) => !(server == "home" || server == "darkweb"))
	)(genDeepScan(ns, "home"))
}
