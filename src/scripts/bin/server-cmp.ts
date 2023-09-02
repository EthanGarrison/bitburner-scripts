import { NS } from "@ns"

import { getProfitableServers } from "scripts/utils/ns-utils.js"

export async function main(ns: NS) { getProfitableServers(ns) }
