import { NS } from "@ns"

import * as iter from "scripts/utils/iterable"
import * as fn from "scripts/utils/fn"

import { ServerThread, genDeepScan, getServerThreadsAvailable } from "scripts/utils/ns-utils"
import { simpleHackScript } from "scripts/utils/constants"

export async function main(ns: NS) {
    const root = "home"
    const { target, "overwrite": killRunning, script } = ns.flags([
        ["target", ""],
        ["overwrite", false],
        ["script", simpleHackScript]
    ])
    if(typeof script != "string") throw "Script must be a path!"
    if(typeof target != "string" || target.length == 0) throw "Target must be a valid server name!"
    if(typeof killRunning != "boolean") throw "Overwrite is a flag and does not accept an argument!"

    // Compose works bottom to top, so read backwards
    fn.compose(
        // Copy script to each server and run
        iter.foreach(({ server, threads }: { server: string, threads: number }) => {
            ns.print(`Taking over ${server}`)
            ns.scp(script, server, root)
            ns.exec(script, server, threads, target)
        }),
        // Debug
        iter.tap(({ server }: ServerThread) => { ns.print(`Attempting ${server}`) }),
        // Get all servers + threads available on them
        getServerThreadsAvailable(ns, killRunning, script, target)
    )(genDeepScan(ns, root))
}
