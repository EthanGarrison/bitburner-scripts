import { NS } from "@ns"
import { assignCompanies, getSleeveCompanies } from "scripts/sleeve/companies"
import { decideTask, isFullyOnline, SleeveConfig, SleeveContext, SleeveTask } from "scripts/sleeve/decide"
import {
  defaultSleeveStatTarget,
  SleeveCityName,
  sleeveBladeburnerTrainingAction,
  sleeveGymCity,
  sleeveGymName
} from "scripts/utils/constants"

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

  const announcedIdle = new Set<number>()
  const unavailableCompanies = new Set<string>()
  const finalStatus = new Map<number, string>()

  do {
    let allOnline = true
    const companies = assignCompanies(sleeveIndexes, getSleeveCompanies(ns))
    const jobs = ns.getPlayer().jobs
    const bladeburnerUnlocked = isBladeburnerUnlocked(ns)

    for (const index of sleeveIndexes) {
      const sleeve = ns.sleeve.getSleeve(index)
      if (!isFullyOnline(sleeve, config)) allOnline = false

      let company = companies.get(index)
      if (company && jobs[company.name] === undefined) {
        if (!unavailableCompanies.has(company.name)) {
          unavailableCompanies.add(company.name)
          ns.print(`Sleeve ${index}: no job at ${company.name}, skipping company work`)
        }
        company = undefined
      }

      const context: SleeveContext = { bladeburnerUnlocked, company }
      const task = decideTask(sleeve, config, context)

      if (task.kind == "idle" && !announcedIdle.has(index)) {
        announcedIdle.add(index)
        ns.tprint(`Sleeve ${index}: idle, nothing to assign (no Bladeburner and no company job)`)
      }

      if (isTaskApplied(ns, index, task)) {
        finalStatus.set(index, describeTask(task))
        continue
      }

      const city = requiredCity(task)
      if (city && sleeve.city != city) {
        if (!ns.sleeve.travel(index, city)) {
          ns.print(`Sleeve ${index}: unable to travel to ${city}`)
          finalStatus.set(index, `failed (travel to ${city}): ${describeTask(task)}`)
          continue
        }
        ns.print(`Sleeve ${index}: traveled to ${city}`)
      }

      if (applyTask(ns, index, task)) {
        ns.print(`Sleeve ${index}: ${describeTask(task)}`)
        finalStatus.set(index, describeTask(task))
      } else {
        ns.print(`Sleeve ${index}: failed to start ${describeTask(task)}`)
        finalStatus.set(index, `failed: ${describeTask(task)}`)
      }
    }

    // Jobs and Bladeburner tasks are decided only once a sleeve is online, and are applied in this same pass
    if (allOnline && !watch) break

    await ns.sleep(loopSleepMs)
  } while (true)

  ns.tprint(["Sleeve summary:", ...sleeveIndexes.map(index => `  Sleeve ${index}: ${finalStatus.get(index) ?? "idle"}`)].join("\n"))
}

function isBladeburnerUnlocked(ns: NS): boolean {
  try {
    return ns.bladeburner.inBladeburner()
  } catch {
    return false
  }
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
    case "bladeburnerTraining": return current?.type == "BLADEBURNER" && current.actionName == sleeveBladeburnerTrainingAction
    case "work": return current?.type == "COMPANY" && current.companyName == task.company.name
    // Idle leaves the sleeve on whatever it is doing; later phases will assign work
    case "idle": return true
  }
}

function applyTask(ns: NS, index: number, task: SleeveTask): boolean {
  switch (task.kind) {
    case "shock": return ns.sleeve.setToShockRecovery(index)
    case "sync": return ns.sleeve.setToSynchronize(index)
    case "train": return ns.sleeve.setToGymWorkout(index, sleeveGymName, task.stat.gymType)
    case "bladeburnerTraining": return ns.sleeve.setToBladeburnerAction(index, sleeveBladeburnerTrainingAction)
    case "work": return ns.sleeve.setToCompanyWork(index, task.company.name)
    case "idle": return true
  }
}

function requiredCity(task: SleeveTask): SleeveCityName | undefined {
  switch (task.kind) {
    case "train": return sleeveGymCity
    case "work": return task.company.city
    case "shock":
    case "sync":
    case "bladeburnerTraining":
    case "idle": return undefined
  }
}

function describeTask(task: SleeveTask): string {
  switch (task.kind) {
    case "train": return `train ${task.stat.skill}`
    case "work": return `work at ${task.company.name}`
    case "bladeburnerTraining": return "Bladeburner training"
    case "shock":
    case "sync":
    case "idle": return task.kind
  }
}
