import { NS } from "@ns"
import { assignCompanies, getSleeveCompanies } from "scripts/sleeve/companies"
import { decideTask, isFullyOnline, SleeveConfig, SleeveContext, SleeveTask } from "scripts/sleeve/decide"
import { gatherFactionInputs, gatherJobInputs, planAssignments, rankFactions, rankJobs } from "scripts/sleeve/factions"
import {
  defaultSleeveStatTarget,
  SleeveCityName,
  sleeveBladeburnerTrainingAction,
  sleeveGymCity,
  sleeveGymName,
  sleeveTrainableStats
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

  const announced = new Set<string>()
  const printedOnce = new Set<string>()
  const failedTravel = new Set<string>()
  const rejected = new Map<number, Set<string>>()
  const finalStatus = new Map<number, string>()

  const announce = (message: string) => {
    if (announced.has(message)) return
    announced.add(message)
    ns.tprint(message)
  }
  const printOnce = (message: string) => {
    if (printedOnce.has(message)) return
    printedOnce.add(message)
    ns.print(message)
  }
  const reject = (index: number, name: string) => {
    rejected.set(index, new Set([...(rejected.get(index) ?? []), name]))
  }

  do {
    const jobs = ns.getPlayer().jobs
    const sleeveStatuses = new Map(sleeveIndexes.map(index => [index, ns.sleeve.getSleeve(index)] as const))
    const pastTraining = sleeveIndexes.filter(index => isFullyOnline(sleeveStatuses.get(index)!, config))
    const allOnline = pastTraining.length == sleeveIndexes.length

    const listedCompanies = getSleeveCompanies(ns)
    for (const company of listedCompanies) {
      if (jobs[company.name] === undefined) printOnce(`No job at ${company.name}, skipping company work`)
    }
    const companyAssignments = new Map([...assignCompanies(sleeveIndexes, listedCompanies, jobs)]
      .filter(([index, company]) => !rejected.get(index)?.has(company.name)))

    const plan = pastTraining.length > 0
      ? planAssignments(
        sleeveIndexes,
        companyAssignments,
        rankFactions(gatherFactionInputs(ns)),
        rankJobs(gatherJobInputs(ns)),
        rejected
      )
      : new Map()
    const bladeburnerUnlocked = isBladeburnerUnlocked(ns, printOnce)

    for (const index of sleeveIndexes) {
      const sleeve = sleeveStatuses.get(index)!
      const current = ns.sleeve.getTask(index)
      const currentGymStat = current?.type == "CLASS"
        ? sleeveTrainableStats.find(stat => stat.gymType == current.classType)?.gymType
        : undefined

      const context: SleeveContext = { bladeburnerUnlocked, currentGymStat, ...plan.get(index) }
      const task = decideTask(sleeve, config, context)

      if (task.kind == "idle") {
        announce(`Sleeve ${index}: idle, nothing to assign (no Bladeburner, company, faction or job); still ${describeCurrentTask(current)}`)
      }

      if (isTaskApplied(ns, index, task)) {
        finalStatus.set(index, task.kind == "idle" ? `idle (${describeCurrentTask(current)})` : describeTask(task))
        continue
      }

      const city = requiredCity(task)
      if (city && sleeve.city != city) {
        const travelKey = `${index}:${city}`
        if (!ns.sleeve.travel(index, city)) {
          if (!failedTravel.has(travelKey)) {
            failedTravel.add(travelKey)
            ns.print(`Sleeve ${index}: unable to travel to ${city}`)
          }
          finalStatus.set(index, `failed (travel to ${city}): ${describeTask(task)}`)
          continue
        }
        failedTravel.delete(travelKey)
        ns.print(`Sleeve ${index}: traveled to ${city}`)
      }

      if (applyTask(ns, index, task, message => announce(`Sleeve ${index}: ${message}`))) {
        ns.print(`Sleeve ${index}: ${describeTask(task)}`)
        finalStatus.set(index, describeTask(task))
      } else {
        const refusedName = rejectableName(task)
        if (refusedName) reject(index, refusedName)
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

function isBladeburnerUnlocked(ns: NS, printOnce: (message: string) => void): boolean {
  try {
    return ns.bladeburner.inBladeburner()
  } catch (error) {
    // Without the Bladeburner API the call throws an error naming the Bladeburner API
    if (!/bladeburner/i.test(errorMessage(error))) throw error
    printOnce("Bladeburner API unavailable, using the gym for stat training")
    return false
  }
}

const errorMessage = (error: unknown) => error instanceof Error ? error.message : String(error)

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
    case "faction": return current?.type == "FACTION"
      && current.factionName == task.faction.name
      && current.factionWorkType == task.faction.workType
    // Idle leaves the sleeve on whatever it is doing; later phases will assign work
    case "idle": return true
  }
}

// Company and faction setters throw when the game refuses the assignment (e.g. another sleeve already holds it)
function attempt(report: (message: string) => void, start: () => boolean | undefined): boolean {
  try {
    return start() === true
  } catch (error) {
    report(errorMessage(error))
    return false
  }
}

function applyTask(ns: NS, index: number, task: SleeveTask, report: (message: string) => void): boolean {
  switch (task.kind) {
    case "shock": return ns.sleeve.setToShockRecovery(index)
    case "sync": return ns.sleeve.setToSynchronize(index)
    case "train": return ns.sleeve.setToGymWorkout(index, sleeveGymName, task.stat.gymType)
    case "bladeburnerTraining": return ns.sleeve.setToBladeburnerAction(index, sleeveBladeburnerTrainingAction)
    case "work": return attempt(report, () => ns.sleeve.setToCompanyWork(index, task.company.name))
    case "faction": return attempt(report, () => ns.sleeve.setToFactionWork(index, task.faction.name, task.faction.workType))
    case "idle": return true
  }
}

function rejectableName(task: SleeveTask): string | undefined {
  switch (task.kind) {
    case "work": return task.company.name
    case "faction": return task.faction.name
    case "shock":
    case "sync":
    case "train":
    case "bladeburnerTraining":
    case "idle": return undefined
  }
}

function requiredCity(task: SleeveTask): SleeveCityName | undefined {
  switch (task.kind) {
    case "train": return sleeveGymCity
    case "shock":
    case "sync":
    case "bladeburnerTraining":
    case "work":
    case "faction":
    case "idle": return undefined
  }
}

function describeTask(task: SleeveTask): string {
  switch (task.kind) {
    case "train": return `train ${task.stat.skill}`
    case "work": return `work at ${task.company.name}`
    case "faction": return `${task.faction.workType} work for ${task.faction.name}`
    case "bladeburnerTraining": return "Bladeburner training"
    case "shock":
    case "sync":
    case "idle": return task.kind
  }
}

function describeCurrentTask(current: ReturnType<NS["sleeve"]["getTask"]>): string {
  if (!current) return "no task"
  switch (current.type) {
    case "COMPANY": return `working at ${current.companyName}`
    case "FACTION": return `${current.factionWorkType} work for ${current.factionName}`
    case "CLASS": return `taking class ${current.classType}`
    case "BLADEBURNER": return `Bladeburner ${current.actionName}`
    case "RECOVERY": return "shock recovery"
    case "SYNCHRO": return "synchronizing"
    case "SUPPORT": return "supporting"
    case "INFILTRATE": return "infiltrating"
    case "CRIME": return `committing ${current.crimeType}`
  }
}
