import { buildServerTree, buildPath } from "scripts/utils/ns-utils"
import { Server } from "../../../NetscriptDefinitions"

export async function main(ns: typeof NS) {
    const home = "home"
    const singularity = ns.singularity
    const player = ns.getPlayer()

    const factionServers = [
        {server: "CSEC", faction: "CyberSec"},
        {server: "avmnite-02h", faction: "NiteSec"},
        {server: "I.I.I.I", faction: "Black Hand"},
        {server: "run4theh111z", faction: "BitRunners"},
        {server: home, faction: ""}
    ]
    let currentServer: Server = ns.getServer(home) // Where we are currently
    for(const {server,faction} of factionServers) {
        const serverInfo = ns.getServer(server) // Where we are heading
        if(serverInfo.backdoorInstalled && server != home) {
            ns.tprint(`Skipping ${server}, backdoor already installed`)
            continue
        }
        if(!(serverInfo.hasAdminRights && serverInfo.requiredHackingSkill <= player.skills.hacking)) {
            ns.tprint(`Skipping ${server}, no root access, or not enough hack levels (required ${serverInfo.requiredHackingSkill})`)
            continue
        }

        const serverTree = buildServerTree(ns, currentServer.hostname)
        const path = buildPath(serverTree, server)
        ns.tprint(`Attempting to connect to ${server} from ${currentServer.hostname} through path ${path.join(",")}`)
        for(const node of path) {
            if(!singularity.connect(node)) {
                ns.toast(`Failed to connect to ${node} while traversing ${path}`, "error")
                return
            }
        }

        // Update our currentServer info with the server we just arrived at
        currentServer = serverInfo
        if(server != home) {
            ns.tprint("Installing backdoor...")
            await singularity.installBackdoor()
            ns.tprint("Backdoor installed, attempting to join faction...")
            while(!(player.factions.includes(faction) || singularity.joinFaction(faction))) await ns.sleep(1000)
            ns.tprint("Faction joined!")
        }
        else ns.tprint("Arrived back at home!")
    }
}
