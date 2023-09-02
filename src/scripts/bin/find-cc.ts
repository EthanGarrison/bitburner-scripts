import { NS } from "@ns"
import { genDeepScan } from "scripts/utils/ns-utils"

export async function main(ns: NS) {
    for(const server of genDeepScan(ns)) {
        const ccFiles = ns.ls(server, ".cct")
        if(ccFiles.length > 0) {
            ns.tprint(`Found CC files in ${server}:`)
            for(const file of ccFiles) {
                const type = ns.codingcontract.getContractType(file, server)
                ns.tprint(` * ${file}: ${type}`)
            }
        }
    }
}
