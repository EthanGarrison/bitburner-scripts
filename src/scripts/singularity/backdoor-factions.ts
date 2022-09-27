import { buildServerTree, buildPath } from "scripts/ns-utils"

export async function main(ns: typeof NS) {
    const home = "home"
    const singularity = ns.singularity
    const player = ns.getPlayer()

    const factionServers = ["CSEC", "avmnite-02h", "I.I.I.I", "run4theh111z", home]
    for(const server of factionServers) {
        const serverTree = buildServerTree(ns)
        const serverHackLevel = ns.getServerRequiredHackingLevel(server)
        if(!(ns.hasRootAccess(server) && serverHackLevel <= player.skills.hacking)) {
            ns.tprint(`Skipping ${server}, no root access, or not enough hack levels (required ${serverHackLevel})`)
            continue
        }

        const path = buildPath(serverTree, server)
        ns.tprint(`Attempting to connect to ${server} through path ${path.join(",")}`)
        for(const node of path) {
            if(!singularity.connect(node)) {
                ns.toast(`Failed to connect to ${node} while traversing ${path}`, "error")
                return
            }
        }
        if(server != home) {
            ns.tprint("Installing backdoor...")
            await singularity.installBackdoor()
            ns.tprint("Backdoor installed, moving on to next server")
        }
        else ns.tprint("Heading home...")
    }
}
