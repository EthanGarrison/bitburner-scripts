import { NS } from "@ns"
import * as iter from "scripts/utils/iterable"

const serverPrefix = "eg-server-"

export async function main(ns: NS) {

    const config = ns.flags([
        ["ram", -1],
        ["upgrade", false],
        ["count", ns.getPurchasedServerLimit()],
        ["dryRun", false]
    ])
    const count: number = typeof config.count == "number" ? config.count : 0
    const ram: number = typeof config.ram == "number" ? config.ram : -1
    const upgrade: boolean = typeof config.upgrade == "boolean" ? config.upgrade : false

    const initialServerCount = upgrade ? 0 : ns.getPurchasedServers().length
    const totalCost = ns.getPurchasedServerCost(ram) * (count - initialServerCount)

    if (config.dryRun) {
        ns.alert(`Dry Run: Buying ${count} servers with ${ram} RAM.  Cost: ${totalCost.toLocaleString()} (${ns.getPurchasedServerCost(ram).toLocaleString()}/server)`)
        return
    }

    if (ns.getPlayer().money <= totalCost) throw `Unable to purchase the servers requested, not enough funds! (${totalCost.toLocaleString()} required)`
    for (const i of iter.range(initialServerCount, count)) {
        const serverName = serverPrefix + i
        // If we should delete for the upgrade and it fails, we should skip the server
        if (upgrade && ns.serverExists(serverName)) {
            // Attempt to kill all scripts, then delete the server
            ns.killall(serverName)
            if (!ns.deleteServer(serverName)) {
                ns.toast(`Failed to upgrade server ${serverName}`)
                continue
            }
        }
        if (ns.purchaseServer(serverName, ram)) {
            ns.toast(`Bought server ${serverName}`)
        }
        else {
            ns.toast("Failed to buy server!")
            break
        }
    }
}
