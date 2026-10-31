import { NS } from "@ns"
import { sleeveCompanies, SleeveCompanyName } from "scripts/utils/constants"
import { SleeveCompany } from "scripts/sleeve/decide"

/**
 * Single company-selection seam. Currently the constant list; a future version
 * can choose companies from ns state (reputation, available jobs, factions).
 */
export function getSleeveCompanies(_ns: NS): readonly SleeveCompany[] {
  return sleeveCompanies
}

/**
 * Gives each sleeve a distinct candidate. Sleeves keep the candidate they already hold when it is still
 * allowed, so changes in candidate order never swap sleeves; the remaining candidates, in order, go to the
 * remaining sleeves. `rejected` holds names refused for a given sleeve.
 */
export function assignSticky<T extends { name: string }>(
  sleeveIndexes: readonly number[],
  candidates: readonly T[],
  currentNames: ReadonlyMap<number, string>,
  rejected: ReadonlyMap<number, ReadonlySet<string>>
): Map<number, T> {
  const isAllowed = (index: number, candidate: T) => !rejected.get(index)?.has(candidate.name)

  const kept = new Map<number, T>()
  for (const index of sleeveIndexes) {
    const claimed = new Set([...kept.values()].map(candidate => candidate.name))
    const held = candidates.find(candidate =>
      candidate.name == currentNames.get(index) && isAllowed(index, candidate) && !claimed.has(candidate.name))
    if (held) kept.set(index, held)
  }

  const result = new Map(kept)
  for (const index of sleeveIndexes.filter(sleeveIndex => !kept.has(sleeveIndex))) {
    const claimed = new Set([...result.values()].map(candidate => candidate.name))
    const next = candidates.find(candidate => !claimed.has(candidate.name) && isAllowed(index, candidate))
    if (next) result.set(index, next)
  }
  return result
}

/** The listed companies the player holds a job at */
export function heldCompanies(
  companies: readonly SleeveCompany[],
  jobs: Partial<Record<SleeveCompanyName, unknown>>
): SleeveCompany[] {
  return companies.filter(company => jobs[company.name] !== undefined)
}
