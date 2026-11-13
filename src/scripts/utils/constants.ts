import type { NS } from "@ns"

export const home = "home"

export const serverFactionMap: any = {
  "CSEC": "CyberSec",
  "avmnite-02h": "NiteSec",
  "I.I.I.I": "The Black Hand",
  "run4theh111z": "BitRunners"
}

export const simpleHackScript = "/scripts/bin/simple-hack.ts"

export const loopHackScript = "/scripts/bin/hack.ts"
export const loopGrowScript = "/scripts/bin/grow.ts"
export const loopWeakenScript = "/scripts/bin/weaken.ts"

export const sleeveGymName = "Powerhouse Gym"
export const sleeveGymCity = "Sector-12"
export const defaultSleeveStatTarget = 75

// Gym stat keys as Skills fields mapped to the ns.sleeve.setToGymWorkout stat argument
export const sleeveTrainableStats = [
  { skill: "strength", gymType: "str" },
  { skill: "defense", gymType: "def" },
  { skill: "dexterity", gymType: "dex" },
  { skill: "agility", gymType: "agi" }
] as const

// CompanyName/CityName are not exported from @ns, so derive them from the API signatures
export type SleeveCityName = Parameters<NS["sleeve"]["travel"]>[1]
export type SleeveCompanyName = Parameters<NS["sleeve"]["setToCompanyWork"]>[1]

export type SleeveFactionName = Parameters<NS["sleeve"]["setToFactionWork"]>[1]
export type SleeveFactionWorkType = Parameters<NS["sleeve"]["setToFactionWork"]>[2]

// Most reputation-efficient for sleeves first
export const sleeveFactionWorkTypePreference = [
  "hacking",
  "field",
  "security"
] as const satisfies readonly SleeveFactionWorkType[]

// Training in Bladeburner is used only to raise stats below target, never as idle work
export const sleeveBladeburnerTrainingAction = "Training"

// Companies that unlock a faction. The faction shares the company's name except for Fulcrum; other companies grant none
export const companyFactions = [
  { company: "ECorp", faction: "ECorp" },
  { company: "MegaCorp", faction: "MegaCorp" },
  { company: "Bachman & Associates", faction: "Bachman & Associates" },
  { company: "Blade Industries", faction: "Blade Industries" },
  { company: "NWO", faction: "NWO" },
  { company: "Clarke Incorporated", faction: "Clarke Incorporated" },
  { company: "OmniTek Incorporated", faction: "OmniTek Incorporated" },
  { company: "Four Sigma", faction: "Four Sigma" },
  { company: "KuaiGong International", faction: "KuaiGong International" },
  { company: "Fulcrum Technologies", faction: "Fulcrum Secret Technologies" }
] as const satisfies readonly { company: SleeveCompanyName, faction: SleeveFactionName }[]

// How long a refused faction/company stays excluded for a sleeve before it is retried
export const sleeveRejectionCooldownMs = 60_000

// Minimum gap between repeats of the same failure message
export const sleeveMessageThrottleMs = 60_000

export const sleeveLoopSleepMs = 5000

// Passes allowed after all sleeves are online for post-online assignments to apply before giving up;
// twice the rejection cooldown so a rejected candidate can expire and be retried within the window
export const sleeveMaxSettlePasses = Math.ceil(sleeveRejectionCooldownMs / sleeveLoopSleepMs) * 2
