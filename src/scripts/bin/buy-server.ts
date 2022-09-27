import * as iter from "scripts/utils/iterable"

const serverPrefix = "eg-server-"

export async function main(ns: typeof NS) {

    const config = ns.flags([
        ["ram", -1],
        ["upgrade", false],
        ["count", ns.getPurchasedServerLimit()]
    ])
    const count: number = typeof config.count == "number" ? config.count : 0
    const ram: number = typeof config.ram == "number" ? config.ram : -1
    const upgrade: boolean = typeof config.upgrade == "boolean" ? config.upgrade : false

    const initialServerCount = upgrade ? 0 : ns.getPurchasedServers().length
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
        ns.purchaseServer(serverName, ram)
        ns.toast(`Bought server ${serverName}`)
    }
}
