import { NS } from "NetscriptDefinitions"

import * as iter from "scripts/utils/iterable"
import * as fn from "scripts/utils/fn"

import { genDeepScan, getRootAccess } from "scripts/utils/ns-utils"

const hackScript = "/scripts/bin/hack.js"

export async function main(ns: NS) {
    const root = "home"
    const { target, "overwrite": killRunning, script } = ns.flags([
        ["target", null],
        ["overwrite", false],
        ["script", hackScript]
    ])
    if(typeof script != "string") throw "Script must be a path!"
    if(typeof target != "string") throw "Target must be a valid server name!"

    const serverList = genDeepScan(ns, root)

    fn.compose(
        iter.foreach(({ server, threads }: { server: string, threads: number }) => {
            ns.print(`Taking over ${server}`)
            ns.scp(script, server, root)
            ns.exec(script, server, threads, target)
        }),
        iter.filter(({ threads }) => threads > 0), // Skip if not enough available threads
        iter.map((server: string) => {
            if (killRunning) ns.killall(server)
            const serverMem = ns.getServerMaxRam(server) - ns.getServerUsedRam(server)
            const threads = Math.floor(serverMem / ns.getScriptRam(script, root))
            return { server, threads }
        }),
        iter.filter((server: string) => server != root && getRootAccess(ns, server)),
        iter.tap(server => { ns.print(`Attempting ${server}`) })
    )(serverList)
}
