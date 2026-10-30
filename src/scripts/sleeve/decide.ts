import { SleeveCityName, SleeveCompanyName, sleeveTrainableStats } from "scripts/utils/constants"

export type TrainableStat = typeof sleeveTrainableStats[number]

export type SleeveCompany = {
  name: SleeveCompanyName
  city: SleeveCityName
}

export type SleeveContext = {
  bladeburnerUnlocked: boolean
  company?: SleeveCompany
}

export type SleeveTask =
    | { kind: "shock" }
    | { kind: "sync" }
    | { kind: "train", stat: TrainableStat }
    | { kind: "bladeburnerTraining" }
    | { kind: "work", company: SleeveCompany }
    | { kind: "idle" }

export type SleeveConfig = {
  statTarget: number
  syncTarget: number
}

/** Subset of ns.sleeve.getSleeve() used for decisions */
export type SleeveStatus = {
  shock: number
  sync: number
  skills: Record<TrainableStat["skill"], number>
}

const statsBelowTarget = (sleeve: SleeveStatus, config: SleeveConfig) =>
  sleeveTrainableStats.filter(stat => sleeve.skills[stat.skill] < config.statTarget)

export function isFullyOnline(sleeve: SleeveStatus, config: SleeveConfig): boolean {
  return sleeve.shock <= 0
        && sleeve.sync >= config.syncTarget
        && statsBelowTarget(sleeve, config).length == 0
}

/**
 * Priority: shock recovery, then synchronize, then raise stats below target
 * (Bladeburner Training when unlocked, otherwise gym), then company work or Bladeburner Training
 */
export function decideTask(sleeve: SleeveStatus, config: SleeveConfig, context: SleeveContext): SleeveTask {
  if (sleeve.shock > 0) return { kind: "shock" }
  if (sleeve.sync < config.syncTarget) return { kind: "sync" }

  const [lowest] = [...statsBelowTarget(sleeve, config)]
    .sort((left, right) => sleeve.skills[left.skill] - sleeve.skills[right.skill])
  if (lowest) return context.bladeburnerUnlocked ? { kind: "bladeburnerTraining" } : { kind: "train", stat: lowest }

  if (context.company) return { kind: "work", company: context.company }
  return context.bladeburnerUnlocked ? { kind: "bladeburnerTraining" } : { kind: "idle" }
}
