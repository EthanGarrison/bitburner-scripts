import { buildServerTree, buildPath } from "scripts/utils/ns-utils"
import { Player, Server } from "../../../NetscriptDefinitions"

const home = "home"

const serverFactionMap = {
    "CSEC": "CyberSec",
    "avmnite-02h": "NiteSec",
    "I.I.I.I": "The Black Hand",
    "run4theh111z": "BitRunners"
}

function connectToServer(ns: typeof NS, src: string, dest: string) {
    const serverTree = buildServerTree(ns, src)
    const path = buildPath(serverTree, dest)
    ns.tprint(`Attempting to connect to ${dest} from ${src} through path ${path.join(",")}`)
    for (const node of path) {
        if (!ns.singularity.connect(node)) {
            ns.toast(`Failed to connect to ${node} while traversing ${path}`, "error")
            return false
        }
    }
    return true
}

async function autoInstallBackdoor(ns: typeof NS, server: Server, player: Player, faction?: string) {
    const currentServerName = ns.singularity.getCurrentServer()
    if (server.backdoorInstalled && server.hostname != home) {
        ns.tprint(`Skipping ${server.hostname}, backdoor already installed`)
        return false
    }
    if (!(server.hasAdminRights && server.requiredHackingSkill <= player.skills.hacking)) {
        const portsRequired = server.numOpenPortsRequired - server.openPortCount
        const hackSkill = server.requiredHackingSkill
        ns.tprint(`Skipping ${server.hostname}, no root access (missing ${portsRequired} ports), or not enough hack levels (required ${hackSkill})`)
        return false
    }

    if(!connectToServer(ns, currentServerName, server.hostname)) return false

    if (server.hostname != home) {
        ns.tprint("Installing backdoor...")
        await ns.singularity.installBackdoor()
        ns.tprint("Backdoor installed, attempting to join faction...")
        while (!(player.factions.includes(faction) || ns.singularity.joinFaction(faction))) await ns.sleep(1000)
        ns.tprint("Faction joined!")
    }
    else ns.tprint("Arrived back at home!")

    return true
}

export async function main(ns: typeof NS) {
    const player = ns.getPlayer()

    const factionServers = ["CSEC", "avmnite-02h", "I.I.I.I", "run4theh111z"]

    for (const server of factionServers) await autoInstallBackdoor(ns, ns.getServer(server), player, serverFactionMap[server])

    // Head home
    const currentServerName = ns.singularity.getCurrentServer()
    if(currentServerName != home) connectToServer(ns, currentServerName, home)
}
