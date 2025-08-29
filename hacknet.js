/** @param {NS} ns */

function getMaxNumOfUpgrades(func, index, level, moneyThreshold){
    const cost = func(index, level);
    if(cost > moneyThreshold){
        return level - 1;
    }
    else{
        return getMaxNumOfUpgrades(func, index, level + 1, moneyThreshold);
    }
}

export async function main(ns) {
    const earlyGameMoneyThreshold = ns.args[0];
    if(ns.hacknet.getPurchaseNodeCost() < earlyGameMoneyThreshold){ns.hacknet.purchaseNode()}
    let numNodes = ns.hacknet.numNodes();
    let levels = 1;
    for(let i = 0; i < numNodes; i++){
        levels = getMaxNumOfUpgrades(ns.hacknet.getLevelUpgradeCost, i, 1, earlyGameMoneyThreshold);
        ns.printf(`Upgraded node ${i} ${ns.hacknet.upgradeLevel(i, levels)}`);
        levels = getMaxNumOfUpgrades(ns.hacknet.getRamUpgradeCost, i, 1, earlyGameMoneyThreshold);
        ns.printf(`Upgraded node ${i} ${ns.hacknet.upgradeRam(i, levels)}`);
        levels = getMaxNumOfUpgrades(ns.hacknet.getCoreUpgradeCost, i, 1, earlyGameMoneyThreshold);
        ns.printf(`Upgraded node ${i} ${ns.hacknet.upgradeCore(i, levels)}`);
        levels = getMaxNumOfUpgrades(ns.hacknet.getLevelUpgradeCost, i, 1, earlyGameMoneyThreshold);
        ns.printf(`Upgraded node ${i} ${ns.hacknet.upgradeLevel(i, levels)}`);
    }
}