import { NS } from "@ns"
import { assignByPosition } from "scripts/sleeve/companies"
import { SleeveCompany, SleeveFaction } from "scripts/sleeve/decide"
import {
  SleeveCompanyName,
  SleeveFactionName,
  sleeveFactionWorkTypePreference,
  SleeveFactionWorkType
} from "scripts/utils/constants"

/*
 * Game rules (Bitburner Sleeve API source): two sleeves cannot work for the same faction or the
 * same company (the API throws), so assignments are distinct. Sleeves cannot work for the faction the
 * player runs a gang with, and the faction must be joined. Company work has no travel requirement
 * and does not conflict with the player's own work.
 */

const neuroFluxGovernor = "NeuroFlux Governor"

export type FactionInput = {
  name: SleeveFactionName
  favor: number
  reputation: number
  /** Reputation requirements of augmentations not yet owned, excluding NeuroFlux Governor */
  remainingAugmentationReputations: readonly number[]
  workTypes: readonly SleeveFactionWorkType[]
}

export type RankedFaction = SleeveFaction & {
  gap: number
}

export type JobInput = {
  company: SleeveCompanyName
  salary: number
}

export type SleeveAssignment = {
  company?: SleeveCompany
  faction?: SleeveFaction
  job?: SleeveCompany
}

export function pickFactionWorkType(workTypes: readonly SleeveFactionWorkType[]): SleeveFactionWorkType | undefined {
  return sleeveFactionWorkTypePreference.find(workType => workTypes.includes(workType))
}

/** Largest remaining reputation gap first, ties by lowest favor then name; factions with no gap or no work type are dropped */
export function rankFactions(factions: readonly FactionInput[]): RankedFaction[] {
  return factions
    .flatMap(faction => {
      const workType = pickFactionWorkType(faction.workTypes)
      const gap = Math.max(0, ...faction.remainingAugmentationReputations) - faction.reputation
      return workType !== undefined && gap > 0 ? [{ name: faction.name, workType, gap, favor: faction.favor }] : []
    })
    .sort((left, right) => right.gap - left.gap || left.favor - right.favor || left.name.localeCompare(right.name))
    .map(({ name, workType, gap }) => ({ name, workType, gap }))
}

/** Highest salary first */
export function rankJobs(jobs: readonly JobInput[]): SleeveCompany[] {
  return [...jobs]
    .sort((left, right) => right.salary - left.salary)
    .map(job => ({ name: job.company }))
}

/**
 * Per sleeve, company list first, then distinct factions, then distinct fallback jobs that no other
 * sleeve uses. `rejected` holds names (faction or company) the game refused for a given sleeve.
 */
export function planAssignments(
  sleeveIndexes: readonly number[],
  companyAssignments: ReadonlyMap<number, SleeveCompany>,
  factions: readonly RankedFaction[],
  jobs: readonly SleeveCompany[],
  rejected: ReadonlyMap<number, ReadonlySet<string>>
): Map<number, SleeveAssignment> {
  const usedFactions = new Set<string>()
  const usedCompanies = new Set<string>([...companyAssignments.values()].map(company => company.name))

  return new Map(sleeveIndexes.map((index): [number, SleeveAssignment] => {
    const company = companyAssignments.get(index)
    if (company) return [index, { company }]

    const refused = rejected.get(index)
    const faction = factions.find(candidate => !usedFactions.has(candidate.name) && !refused?.has(candidate.name))
    if (faction) {
      usedFactions.add(faction.name)
      return [index, { faction }]
    }

    const job = jobs.find(candidate => !usedCompanies.has(candidate.name) && !refused?.has(candidate.name))
    if (job) usedCompanies.add(job.name)
    return [index, { job }]
  }))
}

const reportedUnavailable = new Set<string>()

function reportSingularityUnavailable(ns: NS, what: string) {
  if (reportedUnavailable.has(what)) return
  reportedUnavailable.add(what)
  ns.print(`Singularity unavailable, skipping ${what}`)
}

export function gatherFactionInputs(ns: NS): FactionInput[] {
  try {
    const owned = new Set(ns.singularity.getOwnedAugmentations(true))
    return ns.getPlayer().factions.map(name => ({
      name,
      favor: ns.singularity.getFactionFavor(name),
      reputation: ns.singularity.getFactionRep(name),
      remainingAugmentationReputations: ns.singularity.getAugmentationsFromFaction(name)
        .filter(augmentation => !owned.has(augmentation) && augmentation != neuroFluxGovernor)
        .map(augmentation => ns.singularity.getAugmentationRepReq(augmentation)),
      workTypes: ns.singularity.getFactionWorkTypes(name)
    }))
  } catch {
    reportSingularityUnavailable(ns, "faction work")
    return []
  }
}

export function gatherJobInputs(ns: NS): JobInput[] {
  try {
    return (Object.entries(ns.getPlayer().jobs) as [SleeveCompanyName, Parameters<NS["singularity"]["getCompanyPositionInfo"]>[1]][])
      .map(([company, position]) => ({
        company,
        salary: ns.singularity.getCompanyPositionInfo(company, position).salary
      }))
  } catch {
    reportSingularityUnavailable(ns, "fallback jobs")
    return []
  }
}
