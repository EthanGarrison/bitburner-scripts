import * as typeCheck from "scripts/utils/type"
import * as gen from "scripts/utils/generator"
import * as fn from "scripts/utils/fn"

import { genDeepScan, getRootAccess } from "scripts/ns-utils"
const hackScript = "/scripts/hack.js"

export async function main(ns: typeof NS) {
	const root = "home"
	const { target, "overwrite": killRunning } = ns.flags([
		["target", null],
		["overwrite", false]
	])

	const serverList = genDeepScan(ns, root)

	fn.compose(
		gen.foreach(({ server, threads }: {server: string, threads: number}) => {
			ns.print(`Taking over ${server}`)
			ns.scp(hackScript, server, root)
			ns.exec(hackScript, server, threads, `${target}`)
		}),
		gen.filter(typeCheck.isDefined),
		gen.map((server: string) => {
			if (killRunning) ns.killall(server)

			const serverMem = ns.getServerMaxRam(server) - ns.getServerUsedRam(server)
			const threads = Math.floor(serverMem / ns.getScriptRam(hackScript, root))

			// Skip if not enough available threads
			return threads <= 0 ? null : { server, threads }
		}),
		gen.filter((server: string) => server != root && getRootAccess(ns, server)),
		gen.tap(server => { ns.print(`Attempting ${server}`) })
	)(serverList)
}
