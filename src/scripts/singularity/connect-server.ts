import { NS } from "@ns"
import { connectToServer } from "scripts/singularity/utils"
import { home } from "scripts/utils/constants"

export async function main(ns: NS) {
    const [target] = ns.args
    if (typeof target != "string") throw "No target was given!"
    connectToServer(ns, home, target)
}