import { NS } from "@ns"
import { decideTask, isFullyOnline, SleeveConfig, SleeveTask } from "scripts/sleeve/decide"
import { defaultSleeveStatTarget, sleeveGymCity, sleeveGymName } from "scripts/utils/constants"

const loopSleepMs = 5000

export async function main(ns: NS) {
  ns.disableLog("sleep")
  ns.disableLog("sleeve.getSleeve")
  ns.disableLog("sleeve.getTask")
  ns.disableLog("sleeve.getNumSleeves")

  let { target, "sync-target": syncTarget, sleeves, watch } = ns.flags([
    ["target", defaultSleeveStatTarget],
    ["sync-target", 100],
    ["sleeves", ""],
    ["watch", false]
  ])

  if (typeof target != "number" || target < 0) {
    ns.tprint(`--target '${target}' must be a non-negative number`)
    return
  }

  if (typeof syncTarget != "number" || syncTarget < 0 || syncTarget > 100) {
    ns.tprint(`--sync-target '${syncTarget}' must be a number between 0 and 100`)
    return
  }

  if (typeof watch != "boolean") watch = false

  const sleeveCount = ns.sleeve.getNumSleeves()
  const sleeveIndexes = parseSleeveIndexes(sleeves, sleeveCount)
  if (!sleeveIndexes) {
    ns.tprint(`--sleeves '${sleeves}' must be a comma separated list of sleeve numbers from 0 to ${sleeveCount - 1}`)
    return
  }

  const config: SleeveConfig = { statTarget: target, syncTarget }

  do {
    let allOnline = true

    for (const index of sleeveIndexes) {
      const sleeve = ns.sleeve.getSleeve(index)
      if (!isFullyOnline(sleeve, config)) allOnline = false

      const task = decideTask(sleeve, config)
      if (isTaskApplied(ns, index, task)) continue

      if (task.kind == "train" && sleeve.city != sleeveGymCity) {
        if (!ns.sleeve.travel(index, sleeveGymCity)) {
          ns.print(`Sleeve ${index}: unable to travel to ${sleeveGymCity}`)
          continue
        }
        ns.print(`Sleeve ${index}: traveled to ${sleeveGymCity}`)
      }

      if (applyTask(ns, index, task)) {
        ns.print(`Sleeve ${index}: ${describeTask(task)}`)
      } else {
        ns.print(`Sleeve ${index}: failed to start ${describeTask(task)}`)
      }
    }

    if (allOnline && !watch) break

    await ns.sleep(loopSleepMs)
  } while (true)

  ns.print("All sleeves are fully online")
}

function parseSleeveIndexes(raw: unknown, sleeveCount: number): number[] | undefined {
  const allIndexes = Array.from({ length: sleeveCount }, (_, index) => index)
  if (raw === "" || raw === undefined) return allIndexes

  const parsed = String(raw).split(",").map(part => part.trim()).map(Number)
  const valid = parsed.every(index => Number.isInteger(index) && index >= 0 && index < sleeveCount)
  return valid ? [...new Set(parsed)] : undefined
}

function isTaskApplied(ns: NS, index: number, task: SleeveTask): boolean {
  const current = ns.sleeve.getTask(index)

  switch (task.kind) {
    case "shock": return current?.type == "RECOVERY"
    case "sync": return current?.type == "SYNCHRO"
    case "train": return current?.type == "CLASS" && current.classType == task.stat.gymType
    // Idle leaves the sleeve on whatever it is doing; later phases will assign work
    case "idle": return true
  }
}

function applyTask(ns: NS, index: number, task: SleeveTask): boolean {
  switch (task.kind) {
    case "shock": return ns.sleeve.setToShockRecovery(index)
    case "sync": return ns.sleeve.setToSynchronize(index)
    case "train": return ns.sleeve.setToGymWorkout(index, sleeveGymName, task.stat.gymType)
    case "idle": return true
  }
}

function describeTask(task: SleeveTask): string {
  return task.kind == "train" ? `train ${task.stat.skill}` : task.kind
}
