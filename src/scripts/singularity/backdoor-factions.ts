import { NS } from "NetscriptDefinitions"
import { connectToServer, autoInstallBackdoor } from "scripts/singularity/utils"
import { home, serverFactionMap } from "scripts/utils/constants"

export async function main(ns: NS) {
    const player = ns.getPlayer()

    const factionServers = ["CSEC", "avmnite-02h", "I.I.I.I", "run4theh111z"]

    for (const server of factionServers) await autoInstallBackdoor(ns, ns.getServer(server), player, serverFactionMap[server])

    // Head home
    const currentServerName = ns.singularity.getCurrentServer()
    if (currentServerName != home) connectToServer(ns, currentServerName, home)
}
