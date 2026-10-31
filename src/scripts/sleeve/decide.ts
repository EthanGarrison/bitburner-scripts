import {
  SleeveCompanyName,
  SleeveFactionName,
  SleeveFactionWorkType,
  sleeveTrainableStats
} from "scripts/utils/constants"

export type TrainableStat = typeof sleeveTrainableStats[number]

export type SleeveCompany = {
  name: SleeveCompanyName
}

export type SleeveFaction = {
  name: SleeveFactionName
  workType: SleeveFactionWorkType
}

export type SleeveContext = {
  bladeburnerUnlocked: boolean
  /** Gym stat the sleeve is currently training, kept while still below target to avoid churn */
  currentGymStat?: TrainableStat["gymType"]
  company?: SleeveCompany
  faction?: SleeveFaction
  /** Fallback best-paying job, used when there is no company or faction work */
  job?: SleeveCompany
}

export type SleeveTask =
    | { kind: "shock" }
    | { kind: "sync" }
    | { kind: "train", stat: TrainableStat }
    | { kind: "bladeburnerTraining" }
    | { kind: "work", company: SleeveCompany }
    | { kind: "faction", faction: SleeveFaction }
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
 * Priority: shock recovery, then synchronize, then raise stats below target (Bladeburner Training
 * when unlocked, otherwise gym, keeping the current gym stat while below target), then company-list work,
 * faction work, the best-paying held job, and finally idle
 */
export function decideTask(sleeve: SleeveStatus, config: SleeveConfig, context: SleeveContext): SleeveTask {
  if (sleeve.shock > 0) return { kind: "shock" }
  if (sleeve.sync < config.syncTarget) return { kind: "sync" }

  const below = statsBelowTarget(sleeve, config)
  if (below.length > 0) {
    if (context.bladeburnerUnlocked) return { kind: "bladeburnerTraining" }
    const current = below.find(stat => stat.gymType == context.currentGymStat)
    const [lowest] = [...below].sort((left, right) => sleeve.skills[left.skill] - sleeve.skills[right.skill])
    return { kind: "train", stat: current ?? lowest }
  }

  if (context.company) return { kind: "work", company: context.company }
  if (context.faction) return { kind: "faction", faction: context.faction }
  if (context.job) return { kind: "work", company: context.job }
  return { kind: "idle" }
}
