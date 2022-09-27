import * as typeCheck from "scripts/utils/type"
import * as gen from "scripts/utils/iterable"
import * as fn from "scripts/utils/fn"

import { genDeepScan, getRootAccess } from "scripts/ns-utils"

export async function main(ns: typeof NS) {
	const root = "home"
	const { target, "overwrite": killRunning, script } = ns.flags([
		["target", null],
		["overwrite", false],
		["script", "/scripts/hack.js"]
	])
	if(typeof script != "string") throw "Script must be a path!"
	if(typeof target != "string") throw "Target must be a valid server name!"

	const serverList = genDeepScan(ns, root)

	fn.compose(
		gen.foreach(({ server, threads }: { server: string, threads: number }) => {
			ns.print(`Taking over ${server}`)
			ns.scp(script, server, root)
			ns.exec(script, server, threads, target)
		}),
		gen.filter(({ threads }) => threads > 0), // Skip if not enough available threads
		gen.map((server: string) => {
			if (killRunning) ns.killall(server)
			const serverMem = ns.getServerMaxRam(server) - ns.getServerUsedRam(server)
			const threads = Math.floor(serverMem / ns.getScriptRam(script, root))
			return { server, threads }
		}),
		gen.filter((server: string) => server != root && getRootAccess(ns, server)),
		gen.tap(server => { ns.print(`Attempting ${server}`) })
	)(serverList)
}
