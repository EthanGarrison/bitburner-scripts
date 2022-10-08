import { NS } from "NetscriptDefinitions"
import * as iter from "scripts/utils/iterable"

/**
 * Given allowed cash allowance, attempt to upgrade the given node index,
 * prioritizing cheapest upgrade
 */
function upgradeNode({ print, hacknet }: NS, allowance: number, index: number, upgradeIncrement = 1) {
    const upgradeCommands = [
        // {"name": "cache", "cost": hacknet.getCacheUpgradeCost(index, upgradeIncrement), "upgrade": () => hacknet.upgradeCache(index, upgradeIncrement)},
        {"name": "core", "cost": hacknet.getCoreUpgradeCost(index, upgradeIncrement), "upgrade": () => hacknet.upgradeCore(index, upgradeIncrement)},
        {"name": "level", "cost": hacknet.getLevelUpgradeCost(index, upgradeIncrement), "upgrade": () => hacknet.upgradeLevel(index, upgradeIncrement)},
        {"name": "ram", "cost": hacknet.getRamUpgradeCost(index, upgradeIncrement), "upgrade": () => hacknet.upgradeRam(index, upgradeIncrement)}
    ]

    const cheapestUpgrade = upgradeCommands.sort(({cost: costL}, {cost: costR}) => costL - costR)[0]
    if(cheapestUpgrade.cost <= allowance) {
        print(`Upgrade ${cheapestUpgrade.name} with cost ${cheapestUpgrade.cost}`) 
        cheapestUpgrade.upgrade()
        return cheapestUpgrade.cost
    }
    else return 0
}

/**
 * Get Hacknet production/s.  Not necessarily accurate
 */
function getProductionPerSec(ns: NS) {
    return iter.foldLeft(0)((acc, idx: number) => acc + ns.hacknet.getNodeStats(idx).production)(iter.range(0, ns.hacknet.numNodes()))
}

export async function main(ns: NS) {
    const hacknet = ns.hacknet
    const sleepTimer = 1 * 60 * 1000

    let availableCash = ns.formulas.hacknetNodes.constants().BaseCost
    while(true) {
        const loopStart = new Date().getTime()
        if(availableCash >= ns.getPlayer().money * .2) {
            ns.print(`Internal allocated cash ${availableCash} outside of accepted range, skipping purchase attempts and reseting to zero`)
            availableCash = 0
        }
        else if (availableCash > 0) {
            const newNodeCost = hacknet.getPurchaseNodeCost()
            const nodeCount = hacknet.numNodes()
            if(availableCash > newNodeCost && nodeCount <= hacknet.maxNumNodes()) {
                ns.print(`Purchasing new node for ${newNodeCost}`)
                hacknet.purchaseNode()
                availableCash -= newNodeCost
            }
            else {
                const nodeCashAllowance = Math.floor((availableCash * 100) / nodeCount) / 100
                const totalCost = iter.foldLeft(0)((acc: number, nodeId: number) => acc + upgradeNode(ns, nodeCashAllowance, nodeId, 5))(iter.range(0, nodeCount))
                availableCash -= totalCost
            }
        }
        const productionGenerated = getProductionPerSec(ns)
        await ns.sleep(sleepTimer)
        const loopEnd = new Date().getTime()
        // Skim 25% of production from hacknodes to keep as profit
        availableCash += (productionGenerated * ((loopEnd - loopStart) / 1000)) * 0.75
        if(availableCash > ns.getPlayer().money * .2) {
            ns.print(`Internal allocated cash ${availableCash} is more than actually available, resetting to 0`)
            availableCash = 0
        }
        ns.print(`New availableCash: ${availableCash}`)
    }
}
