import { NS, Player, Server } from "@ns"
import { buildServerTree, buildPath } from "scripts/utils/ns-utils"
import { home } from "scripts/utils/constants"
import { filter, foldLeft } from "scripts/utils/iterable"

const rootPrograms = ["BruteSSH.exe", "FTPCrack.exe", "relaySMTP.exe", "HTTPWorm.exe", "SQLInject.exe"]

export function connectToServer(ns: NS, src: string, dest: string) {
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

export async function autoInstallBackdoor(ns: NS, server: Server, player: Player, faction?: string) {
    const currentServerName = ns.singularity.getCurrentServer()
    if (server.backdoorInstalled || server.hostname == home) {
        ns.tprint(`Skipping ${server.hostname}, backdoor already installed`)
        return false
    }
    if (!(server.hasAdminRights && (server.requiredHackingSkill ?? Infinity) <= player.skills.hacking)) {
        const portsRequired = (server.numOpenPortsRequired ?? Infinity) - (server.openPortCount ?? 0)
        const hackSkill = server.requiredHackingSkill
        ns.tprint(`Skipping ${server.hostname}, no root access (missing ${portsRequired >= 0 ? portsRequired : 0} ports), or not enough hack levels (required ${hackSkill})`)
        return false
    }

    if (!connectToServer(ns, currentServerName, server.hostname)) return false

    ns.tprint("Installing backdoor...")
    await ns.singularity.installBackdoor()
    ns.tprint("Backdoor installed")

    if (typeof faction == "string") {
        ns.tprint("Attempting to join faction...")
        while (!(player.factions.includes(faction) || ns.singularity.joinFaction(faction))) await ns.sleep(1000)
        ns.tprint("Faction joined!")
    }

    return connectToServer(ns, server.hostname, currentServerName)
}

export function buyTorPrograms(ns: NS) {
    if (ns.singularity.purchaseTor()) {
        // Filter by what we already own to reduce the calculated total cost
        const ownedPrograms = ns.ls("home", ".exe")
        const filtered = filter((_: string) => !ownedPrograms.includes(_))(rootPrograms)
        return foldLeft<string, boolean>(true)((acc, program) => acc && ns.singularity.purchaseProgram(program))(filtered)
    }
    else return false
}
