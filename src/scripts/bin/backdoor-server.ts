import { NS } from "@ns"
import { autoInstallBackdoor } from "scripts/singularity/utils"

export async function main(ns: NS) {
    const [server] = ns.args
    if (typeof server != "string") throw "Server must be a valid string!"
    await autoInstallBackdoor(ns, ns.getServer(server), ns.getPlayer())
}
