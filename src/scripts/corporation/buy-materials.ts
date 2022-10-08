import { NS } from "NetscriptDefinitions"

export async function main(ns: NS) {
    const corporation = ns.corporation
    corporation.bulkPurchase("eg-crops", "Aevum", "Hardware", 2675)
}
