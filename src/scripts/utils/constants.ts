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

export const sleeveCompanyCities: Partial<Record<SleeveCompanyName, SleeveCityName>> = {
  "AeroCorp": "Aevum",
  "Bachman & Associates": "Aevum",
  "Clarke Incorporated": "Aevum",
  "ECorp": "Aevum",
  "Fulcrum Technologies": "Aevum",
  "Galactic Cybersystems": "Aevum",
  "NetLink Technologies": "Aevum",
  "Aevum Police Headquarters": "Aevum",
  "Rho Construction": "Aevum",
  "Watchdog Security": "Aevum",
  "Alpha Enterprises": "Sector-12",
  "Blade Industries": "Sector-12",
  "Carmichael Security": "Sector-12",
  "Central Intelligence Agency": "Sector-12",
  "DeltaOne": "Sector-12",
  "FoodNStuff": "Sector-12",
  "Four Sigma": "Sector-12",
  "Icarus Microsystems": "Sector-12",
  "Joe's Guns": "Sector-12",
  "MegaCorp": "Sector-12",
  "National Security Agency": "Sector-12",
  "Universal Energy": "Sector-12",
  "CompuTek": "Volhaven",
  "Helios Labs": "Volhaven",
  "LexoCorp": "Volhaven",
  "NWO": "Volhaven",
  "OmniTek Incorporated": "Volhaven",
  "Omnia Cybersystems": "Volhaven",
  "SysCore Securities": "Volhaven",
  "KuaiGong International": "Chongqing",
  "Solaris Space Systems": "Chongqing",
  "Nova Medical": "Ishima",
  "Omega Software": "Ishima",
  "Storm Technologies": "Ishima",
  "DefComm": "New Tokyo",
  "Global Pharmaceuticals": "New Tokyo",
  "Noodle Bar": "New Tokyo",
  "VitaLife": "New Tokyo"
}

// Placeholder list, ordered by priority: the first company goes to the first sleeve, and so on
export const sleeveCompanies = [
  { name: "MegaCorp", city: "Sector-12" },
  { name: "Blade Industries", city: "Sector-12" },
  { name: "ECorp", city: "Aevum" },
  { name: "Bachman & Associates", city: "Aevum" },
  { name: "NWO", city: "Volhaven" }
] as const satisfies readonly { name: SleeveCompanyName, city: SleeveCityName }[]
