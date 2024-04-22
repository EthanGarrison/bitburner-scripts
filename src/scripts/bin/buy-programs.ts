import { NS } from "@ns";
import { buyTorPrograms } from "/scripts/singularity/utils";

export async function main(ns: NS) { while (!buyTorPrograms(ns)) await ns.sleep(60 * 1000) }
