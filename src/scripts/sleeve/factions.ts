import { NS } from "@ns"
import { assignSticky } from "scripts/sleeve/companies"
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

export type RejectionBook = ReadonlyMap<number, ReadonlyMap<string, number>>

/** Rejections still in effect at `now`, as the name sets the planner takes */
export function activeRejections(book: RejectionBook, now: number): Map<number, Set<string>> {
  return new Map([...book].map(([index, entries]) => [
    index,
    new Set([...entries].filter(([, expiresAt]) => expiresAt > now).map(([name]) => name))
  ]))
}

/** What a sleeve is working on right now, by name */
export type CurrentWork = {
  company?: string
  faction?: string
}

/** Sleeves already working on what another will leave must be applied before the one that takes it over */
export function releasersFirst<T>(
  items: readonly T[],
  current: (item: T) => CurrentWork,
  claimed: (item: T) => CurrentWork
): T[] {
  const releases = (item: T) => {
    const held = current(item)
    const next = claimed(item)
    return (held.company !== undefined && held.company != next.company)
      || (held.faction !== undefined && held.faction != next.faction)
  }
  return [...items.filter(releases), ...items.filter(item => !releases(item))]
}

/**
 * Over the given (online) sleeves: company-list work first, then distinct factions, then distinct
 * fallback jobs no other sleeve uses. Each step prefers what a sleeve already does when still a valid
 * candidate, so rank changes never swap sleeves, and holders are settled before newcomers so nobody is
 * told to take a faction another sleeve still holds. `rejected` holds names the game refused per sleeve.
 */
export function planAssignments(
  sleeveIndexes: readonly number[],
  companies: readonly SleeveCompany[],
  factions: readonly RankedFaction[],
  jobs: readonly SleeveCompany[],
  current: ReadonlyMap<number, CurrentWork>,
  rejected: ReadonlyMap<number, ReadonlySet<string>>,
  heldElsewhere: readonly CurrentWork[] = []
): Map<number, SleeveAssignment> {
  const unavailable = new Set(heldElsewhere.flatMap(work => [work.company, work.faction]).filter(name => name !== undefined))
  const available = <T extends { name: string }>(candidates: readonly T[]) =>
    candidates.filter(candidate => !unavailable.has(candidate.name))
  const namesOf = (pick: (work: CurrentWork) => string | undefined) => new Map(
    sleeveIndexes.flatMap(index => {
      const name = pick(current.get(index) ?? {})
      return name === undefined ? [] : [[index, name] as const]
    }))
  const currentCompanies = namesOf(work => work.company)
  const currentFactions = namesOf(work => work.faction)

  const companyAssignments = assignSticky(sleeveIndexes, available(companies), currentCompanies, rejected)
  const withoutCompany = sleeveIndexes.filter(index => !companyAssignments.has(index))

  const factionAssignments = assignSticky(withoutCompany, available(factions), currentFactions, rejected)
  const withoutFaction = withoutCompany.filter(index => !factionAssignments.has(index))

  const usedCompanies = new Set([...companyAssignments.values()].map(company => company.name))
  const jobAssignments = assignSticky(
    withoutFaction,
    available(jobs).filter(job => !usedCompanies.has(job.name)),
    currentCompanies,
    rejected
  )

  return new Map(sleeveIndexes.map((index): [number, SleeveAssignment] => [index, {
    company: companyAssignments.get(index),
    faction: factionAssignments.get(index),
    job: jobAssignments.get(index)
  }]))
}

const reportedUnavailable = new Set<string>()

function reportSingularityUnavailable(ns: NS, what: string) {
  if (reportedUnavailable.has(what)) return
  reportedUnavailable.add(what)
  ns.print(`Singularity unavailable, skipping ${what}`)
}

// Sleeves cannot work for the player's gang faction; without the gang API there is no gang
function getGangFaction(ns: NS): string | undefined {
  try {
    return ns.gang.inGang() ? ns.gang.getGangInformation().faction : undefined
  } catch {
    return undefined
  }
}

export function gatherFactionInputs(ns: NS): FactionInput[] {
  try {
    const owned = new Set(ns.singularity.getOwnedAugmentations(true))
    const gangFaction = getGangFaction(ns)
    return ns.getPlayer().factions.filter(name => name != gangFaction).map(name => ({
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
