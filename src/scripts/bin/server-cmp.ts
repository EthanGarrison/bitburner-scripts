import { NS } from "NetscriptDefinitions"

import { getProfitableServers } from "scripts/utils/ns-utils.js"

export async function main(ns: NS) { getProfitableServers(ns) }
