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
