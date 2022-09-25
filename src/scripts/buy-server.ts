import * as iter from "scripts/utils/iterable"

const serverPrefix = "eg-server-"

export async function main(ns: typeof NS) {

    const config = ns.flags([
        ["ram", -1],
        ["count", ns.getPurchasedServerLimit()]
    ])
    const count: number = typeof config.count == "number" ? config.count : 0
    const ram: number = typeof config.ram == "number" ? config.ram : -1

    const initialServerCount = ns.getPurchasedServers().length
    for(const i of iter.range(initialServerCount, count)) {
        const serverName = serverPrefix + i
        ns.purchaseServer(serverName, ram)
        ns.toast(`Bought server ${serverName}`)
    }
}
