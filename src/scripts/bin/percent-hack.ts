import { NS } from "@ns"

import * as iter from "scripts/utils/iterable"

import { ServerThread, genDeepScan, getServerThreadsAvailable } from "scripts/utils/ns-utils"
import { simpleHackScript } from "scripts/utils/constants"

export async function main(ns: NS) {
    // Disabling logging, as it is very noisy in scripts like this
    ns.disableLog("scan")
    // ns.disableLog("getServerMaxRam")
    // ns.disableLog("getServerUsedRam")

    const root = "home"
    const { target, "overwrite": killRunning, script, percentage } = ns.flags([
        ["target", ""],
        ["overwrite", false],
        ["script", simpleHackScript],
        ["percentage", 0.10]
    ])
    if(typeof script != "string") throw "Script must be a path!"
    if(typeof target != "string" || target.length == 0) throw "Target must be a valid server name!"
    if(typeof percentage != "number" || (percentage < 0 && percentage >= 1)) throw "Percentage must be a number in the range (0,1]"

    const serverThreadList = iter.toArray(getServerThreadsAvailable(ns, !!killRunning)(genDeepScan(ns, root)))

    const totalThreads = iter.foldLeft<ServerThread, number>(0)((acc, { thread }) => acc + thread)(serverThreadList)
    ns.tprint(`Total threads available from open servers: ${totalThreads}`)

    // Would be better if we had a sort of State monad, until then will have to parse servers even after fulfilled requested threads
    iter.foldLeft<ServerThread, number>(Math.floor(totalThreads * percentage))((acc, { server, thread }) => {
        ns.tprint(`Trying to have ${server} use ${acc} threads, has ${thread} available`)
        if(acc != 0) {
            const usedThreads = acc >= thread ? thread : acc
            ns.print(`Taking over ${server}`)
            ns.scp(script, server, root)
            ns.exec(script, server, thread, target)
            return acc - usedThreads
        }
        else return 0
    })(serverThreadList)
}
