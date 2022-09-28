import * as iter from "scripts/utils/iterable"
import * as fn from "scripts/utils/fn"

import { genDeepScan } from "scripts/utils/ns-utils"

const hackScript = "/scripts/bin/hack.js"

export async function main(ns: typeof NS) {
    // Disabling logging, as it is very noisy in scripts like this
    ns.disableLog("scan")
    // ns.disableLog("getServerMaxRam")
    // ns.disableLog("getServerUsedRam")

    const root = "home"
    const { target, "overwrite": killRunning, script, percentage } = ns.flags([
        ["target", null],
        ["overwrite", false],
        ["script", hackScript],
        ["percentage", 0.10]
    ])
    if(typeof script != "string") throw "Script must be a path!"
    if(typeof target != "string") throw "Target must be a valid server name!"
    if(typeof percentage != "number" || (percentage <= 0 && percentage > 1)) throw "Percentage must be a number in the range (0,1]"

    const serverList = genDeepScan(ns, root)

    const serverThreadList: { server: string, threads: number }[] = fn.compose(
        iter.toArray,
        iter.filter(({ threads }) => threads > 0), // Skip if not enough available threads
        iter.map((server: string) => {
            if (killRunning) ns.killall(server)
            const serverMem = ns.getServerMaxRam(server) - ns.getServerUsedRam(server)
            const threads = Math.max(Math.floor(serverMem / ns.getScriptRam(script, root)), 0)
            return { server, threads }
        }),
        iter.filter((server: string) => server != root && ns.hasRootAccess(server) && !ns.isRunning(script, server, target)),
        iter.tap(server => { ns.print(`Attempting ${server}`) })
    )(serverList)

    const totalThreads = iter.foldLeft(0)((acc, { threads }) => acc + threads)(serverThreadList)
    ns.tprint(`Total threads available from open servers: ${totalThreads}`)
    // Would be better if we had a sort of State monad, until then will have to parse servers even after fulfilled requested threads
    iter.foldLeft(Math.floor(totalThreads * percentage))((acc, { server, threads }) => {
        ns.tprint(`Trying to have ${server} use ${acc} threads, has ${threads} available`)
        if(acc != 0) {
            const usedThreads = acc >= threads ? threads : acc
            ns.print(`Taking over ${server}`)
            ns.scp(script, server, root)
            ns.exec(script, server, threads, target)
            return acc - usedThreads
        }
        else return 0
    })(serverThreadList)
}
