import { NS } from "@ns"
import { reportSingularityUnavailable } from "scripts/sleeve/factions"
import { SleeveCompany } from "scripts/sleeve/decide"
import { companyFactions, SleeveCompanyName } from "scripts/utils/constants"

const neuroFluxGovernor = "NeuroFlux Governor"

export type CompanyInput = {
  company: SleeveCompanyName
  /** Augmentations of the company's faction not yet owned, excluding NeuroFlux Governor */
  remainingAugmentations: number
  /** Those remaining augmentations no other faction offers */
  uniqueAugmentations: number
}

/** Most unique augmentations first, ties by most remaining augmentations then name; companies with nothing left to gain are dropped */
export function rankCompanies(companies: readonly CompanyInput[]): SleeveCompany[] {
  return companies
    .filter(company => company.remainingAugmentations > 0)
    .sort((left, right) =>
      right.uniqueAugmentations - left.uniqueAugmentations
      || right.remainingAugmentations - left.remainingAugmentations
      || left.company.localeCompare(right.company))
    .map(({ company }) => ({ name: company }))
}

/** Held jobs at companies whose faction the player has neither joined nor been invited to */
export function gatherCompanyInputs(ns: NS): CompanyInput[] {
  try {
    const jobs = ns.getPlayer().jobs
    const joinedOrInvited = new Set<string>([...ns.getPlayer().factions, ...ns.singularity.checkFactionInvitations()])
    const owned = new Set(ns.singularity.getOwnedAugmentations(true))

    return companyFactions
      .filter(({ company, faction }) => jobs[company] !== undefined && !joinedOrInvited.has(faction))
      .map(({ company, faction }) => {
        const remaining = ns.singularity.getAugmentationsFromFaction(faction)
          .filter(augmentation => !owned.has(augmentation) && augmentation != neuroFluxGovernor)
        return {
          company,
          remainingAugmentations: remaining.length,
          uniqueAugmentations: remaining.filter(augmentation => ns.singularity.getAugmentationFactions(augmentation).length == 1).length
        }
      })
  } catch {
    reportSingularityUnavailable(ns, "company selection")
    return []
  }
}

/** Company-selection seam: the companies worth sleeve work, best first */
export function getSleeveCompanies(ns: NS): SleeveCompany[] {
  return rankCompanies(gatherCompanyInputs(ns))
}
