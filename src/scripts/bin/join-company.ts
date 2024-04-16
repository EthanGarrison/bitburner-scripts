import { NS } from "@ns"
import { EGCompanyName } from "scripts/utils/ns-utils"

export async function main(ns: NS) {
  function isAllowedName(n: any): n is Parameters<typeof ns.singularity.applyToCompany>[0] {
    return typeof n == "string" && EGCompanyName.includes(n)
  }

  let { company, watch } = ns.flags([
    ["company", ""],
    ["watch", false]
  ])

  if (!isAllowedName(company)) {
    ns.tprint(`--company '${company}' must be a valid company name, see [[ CompanyName ]]`)
    return
  }

  if (typeof watch != "boolean") watch = false

  // Do/While so that this is attempted at least once.
  // We want to continue to apply to the company until we are the top rank
  // Could do checks to see if we are even allowed to work there, but meh
  do {
    ns.singularity.applyToCompany(company, "Software")

    // Check if player is the top rank for software so that the script can end
    if (ns.getPlayer().jobs[company] == "Chief Technology Officer") break

    await ns.sleep(60000)
  } while (watch)
}

