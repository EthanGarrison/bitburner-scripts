import { NS } from "@ns"
import * as iter from "scripts/utils/iterable"
import { home, loopGrowScript, loopHackScript, loopWeakenScript } from "scripts/utils/constants"
import { genDeepScan, getHGWCount, getServerThreadsAvailable, ServerThread, HGWThreadCount } from "scripts/utils/ns-utils"

export async function main(ns: NS) {
    const { target, "overwrite": killRunning } = ns.flags([
        ["target", false],
        ["overwrite", false]
    ])
    if (typeof target != "string") throw "Target must be a valid server name!"
    if (typeof killRunning != "boolean") throw "Overwrite is a flag and does not accept an argument!"

    const serverList = genDeepScan(ns)
    // Calculate the available threads on the server
    const serverThreadList = iter.toArray(getServerThreadsAvailable(ns, killRunning, loopHackScript, target)(serverList))
    // Split available threads into hack, grow, and weaken count
    const hgwCount = getHGWCount(ns, ns.getServer(target), ns.getPlayer())
    // Calculate the total threads available across all servers
    const totalThreadCount = iter.foldLeft<ServerThread, number>(0)((acc: number, serverThreads: ServerThread) => acc + serverThreads.thread)(serverThreadList)

    // Basic math checks to say if we have enough threads for HGW
    const hgwThreadSum = hgwCount.hack + hgwCount.grow + hgwCount.weaken
    if(hgwThreadSum == 0) throw "Calculated required threads was zero!"
    if(hgwThreadSum > totalThreadCount) throw "Calculated required threads greater than available!"

    // Calculate total thread count for HGW
    const totalOverSum = totalThreadCount / hgwThreadSum
    const totalGrowThreads = hgwCount.grow * totalOverSum
    const totalWeakenThreads = hgwCount.weaken * totalOverSum
    const totalHackThreads = hgwCount.hack * totalOverSum

    // Given a server and script, attempt to allocate as many threads on this server as needed.
    function allocateAndRun(server: string, script: string, target: string | number | boolean, threadAvailable: number, threadNeeded: number) {
        if (threadNeeded > 0 && threadAvailable > 0) {
            const allocatedThreads = threadAvailable >= threadNeeded ? threadNeeded : threadAvailable
            ns.print(`Running ${allocatedThreads} for hack on ${server}`)
            ns.scp(loopHackScript, server, home)
            ns.exec(script, server, allocatedThreads, target)
            return allocatedThreads
        }
        return 0
    }

    iter.foldLeft<ServerThread, HGWThreadCount>({ hack: totalHackThreads, grow: totalGrowThreads, weaken: totalWeakenThreads })(
        ({ hack, grow, weaken }, { server, thread }) => {
            let _thread = thread

            const hackThreadAllocated = allocateAndRun(server, loopHackScript, target, _thread, hack)
            const newHack = hack - hackThreadAllocated
            _thread -= hackThreadAllocated

            const growThreadAllocated = allocateAndRun(server, loopGrowScript, target, _thread, grow)
            const newGrow = grow - growThreadAllocated
            _thread -= growThreadAllocated

            const weakenThreadAllocated = allocateAndRun(server, loopWeakenScript, target, _thread, grow)
            const newWeaken = weaken - weakenThreadAllocated
            _thread -= weakenThreadAllocated

            return { hack: newHack, grow: newGrow, weaken: newWeaken }
        }
    )
}
