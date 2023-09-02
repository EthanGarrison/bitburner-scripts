import { NS } from "@ns"
import { connectToServer, autoInstallBackdoor } from "scripts/singularity/utils"
import { home, serverFactionMap } from "scripts/utils/constants"

export async function main(ns: NS) {
    const player = ns.getPlayer()

    for (const server in serverFactionMap) await autoInstallBackdoor(ns, ns.getServer(server), player, serverFactionMap[server])

    // Head home
    const currentServerName = ns.singularity.getCurrentServer()
    if (currentServerName != home) connectToServer(ns, currentServerName, home)
}
