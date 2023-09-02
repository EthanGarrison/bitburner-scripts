import { NS } from "@ns"

import * as iter from "scripts/utils/iterable"
import * as fn from "scripts/utils/fn"

import { ServerThread, genDeepScan, getServerThreadsAvailable } from "scripts/utils/ns-utils"
import { simpleHackScript } from "scripts/utils/constants"

export async function main(ns: NS) {
    const root = "home"
    const { target, "overwrite": killRunning, script } = ns.flags([
        ["target", false],
        ["overwrite", false],
        ["script", simpleHackScript]
    ])
    if(typeof script != "string") throw "Script must be a path!"
    if(typeof target != "string") throw "Target must be a valid server name!"
    if(typeof killRunning != "boolean") throw "Overwrite is a flag and does not accept an argument!"

    fn.compose(
        iter.foreach(({ server, threads }: { server: string, threads: number }) => {
            ns.print(`Taking over ${server}`)
            ns.scp(script, server, root)
            ns.exec(script, server, threads, target)
        }),
        iter.tap(({ server }: ServerThread) => { ns.print(`Attempting ${server}`) }),
        getServerThreadsAvailable(ns, killRunning, script, target)
    )(genDeepScan(ns, root))
}
