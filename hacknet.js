export async function main(ns) {
    const earlyGameMoneyThreshold = ns.args[0];
    if(ns.hacknet.getPurchaseNodeCost() < earlyGameMoneyThreshold){ns.hacknet.purchaseNode()}
    let numNodes = ns.hacknet.numNodes();
    let levels = 1;
    for(let i = 0; i < numNodes; i++){
        levels = getMaxNumOfUpgrades(ns.hacknet.getLevelUpgradeCost, i, 1, moneyThreshold);
        ns.printf(`Upgraded node ${i} ${ns.hacknet.upgradeLevel(i, levels)}`);
        levels = getMaxNumOfUpgrades(ns.hacknet.getRamUpgradeCost, i, 1, moneyThreshold);
        ns.printf(`Upgraded node ${i} ${ns.hacknet.upgradeRam(i, levels)}`);
        levels = getMaxNumOfUpgrades(ns.hacknet.getCoreUpgradeCost, i, 1, moneyThreshold);
        ns.printf(`Upgraded node ${i} ${ns.hacknet.upgradeCore(i, levels)}`);
        levels = getMaxNumOfUpgrades(ns.hacknet.getLevelUpgradeCost, i, 1, moneyThreshold);
        ns.printf(`Upgraded node ${i} ${ns.hacknet.upgradeLevel(i, levels)}`);
    }
}