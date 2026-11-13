import { NS } from "@ns"
import { reportSingularityUnavailable } from "scripts/sleeve/factions"
import { AugmentationStats, sleeveAugmentationValuedMultipliers } from "scripts/utils/constants"

export type ValuedMultipliers = Pick<AugmentationStats, typeof sleeveAugmentationValuedMultipliers[number]>

export type AugmentationInput = {
  name: string
  cost: number
  multipliers: ValuedMultipliers
}

export type RankedAugmentation = {
  name: string
  cost: number
  score: number
}

/** Total bonus over the multipliers sleeves benefit from: a 1.1 multiplier is worth 0.1 */
export function scoreAugmentation(multipliers: ValuedMultipliers): number {
  return sleeveAugmentationValuedMultipliers.reduce((total, key) => total + multipliers[key] - 1, 0)
}

/** Highest score first, ties cheapest then name; augmentations with nothing to gain are dropped */
export function rankAugmentations(augmentations: readonly AugmentationInput[]): RankedAugmentation[] {
  return augmentations
    .map(({ name, cost, multipliers }) => ({ name, cost, score: scoreAugmentation(multipliers) }))
    .filter(augmentation => augmentation.score > 0)
    .sort((left, right) => right.score - left.score || left.cost - right.cost || left.name.localeCompare(right.name))
}

/** The best-ranked augmentation costing at most `budgetFraction` of `money` */
export function pickAffordable(
  ranked: readonly RankedAugmentation[],
  money: number,
  budgetFraction: number
): RankedAugmentation | undefined {
  return ranked.find(augmentation => augmentation.cost <= money * budgetFraction)
}

function gatherAugmentationInputs(ns: NS, index: number, statsCache: Map<string, ValuedMultipliers>): AugmentationInput[] {
  try {
    return ns.sleeve.getSleevePurchasableAugs(index).map(({ name, cost }) => {
      const cached = statsCache.get(name)
      const multipliers = cached ?? ns.singularity.getAugmentationStats(name)
      statsCache.set(name, multipliers)
      return { name, cost, multipliers }
    })
  } catch {
    reportSingularityUnavailable(ns, "sleeve augmentations")
    return []
  }
}

/**
 * Buys augmentations for one sleeve in rank order while each fits the budget, re-reading the player's
 * money after every purchase. Returns the names bought; a refused purchase stops this sleeve for the pass.
 */
export function buyAugmentations(
  ns: NS,
  index: number,
  budgetFraction: number,
  statsCache: Map<string, ValuedMultipliers>,
  reportFailure: (message: string) => void
): string[] {
  const purchased: string[] = []
  let remaining = rankAugmentations(gatherAugmentationInputs(ns, index, statsCache))

  while (true) {
    const pick = pickAffordable(remaining, ns.getPlayer().money, budgetFraction)
    if (!pick) break
    if (!ns.sleeve.purchaseSleeveAug(index, pick.name)) {
      reportFailure(`Sleeve ${index}: failed to buy ${pick.name}`)
      break
    }
    purchased.push(pick.name)
    remaining = remaining.filter(augmentation => augmentation.name != pick.name)
  }
  return purchased
}
