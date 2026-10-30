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

/** Assigns items to sleeves by position; sleeves beyond the list get nothing */
export function assignByPosition<T>(
  sleeveIndexes: readonly number[],
  items: readonly T[]
): Map<number, T> {
  return new Map(
    sleeveIndexes.flatMap((sleeveIndex, position) =>
      position < items.length ? [[sleeveIndex, items[position]] as const] : [])
  )
}

/** Assigns the listed companies the player holds a job at to sleeves by position */
export function assignCompanies(
  sleeveIndexes: readonly number[],
  companies: readonly SleeveCompany[],
  jobs: Partial<Record<SleeveCompanyName, unknown>>
): Map<number, SleeveCompany> {
  return assignByPosition(sleeveIndexes, companies.filter(company => jobs[company.name] !== undefined))
}
