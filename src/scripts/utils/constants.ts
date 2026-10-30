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

export const sleeveBladeburnerTrainingAction = "Training"

// Placeholder list, ordered by priority: the first company goes to the first sleeve, and so on
export const sleeveCompanies = [
  { name: "MegaCorp", city: "Sector-12" },
  { name: "Blade Industries", city: "Sector-12" },
  { name: "ECorp", city: "Aevum" },
  { name: "Bachman & Associates", city: "Aevum" },
  { name: "NWO", city: "Volhaven" }
] as const satisfies readonly { name: SleeveCompanyName, city: SleeveCityName }[]
