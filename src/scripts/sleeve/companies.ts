import { NS } from "@ns"
import { sleeveCompanies } from "scripts/utils/constants"
import { SleeveCompany } from "scripts/sleeve/decide"

/**
 * Single company-selection seam. Currently the constant list; a future version
 * can choose companies from ns state (reputation, available jobs, factions).
 */
export function getSleeveCompanies(_ns: NS): readonly SleeveCompany[] {
  return sleeveCompanies
}

/** Assigns companies to sleeves by position; sleeves beyond the list get no company */
export function assignCompanies(
  sleeveIndexes: readonly number[],
  companies: readonly SleeveCompany[]
): Map<number, SleeveCompany> {
  return new Map(
    sleeveIndexes.flatMap((sleeveIndex, position) =>
      position < companies.length ? [[sleeveIndex, companies[position]] as const] : [])
  )
}
