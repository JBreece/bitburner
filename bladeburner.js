function getStaminaPercentage(ns) {
   const [current, max] = ns.bladeburner.getStamina();
   return current / max;
}

function averageSuccessRate(ns, actionType, actionName, sleeve){
    if(sleeve){
        const successRate = ns.bladeburner.getActionEstimatedSuccessChance(actionType, actionName, sleeve);
        return ((successRate[0] + successRate[1])/2);
    }
    else{
        const successRate = ns.bladeburner.getActionEstimatedSuccessChance(actionType, actionName);
        return ((successRate[0] + successRate[1])/2);
    }
}

function findNewCity(ns, chaosThreshold){
    let allCities = ["Aevum", "Chongqing", "Ishima", "New Tokyo", "Sector-12", "Volhaven"];
    allCities.splice(allCities.indexOf(ns.bladeburner.getCity()), 1);  // remove current city
    for(const city of allCities){
        if(ns.bladeburner.getCityChaos(city) < chaosThreshold){
            return city;
        }
    }
    // TODO make this check for remaining contracts/operations too
    // TODO make this check for sufficient synthoid communities and population
}

export async function main(ns) {
    while(!ns.bladeburner.inBladeburner()){
        ns.bladeburner.joinBladeburnerDivision();
        ns.sleep(10000);
    }

    // constants - adjust these if needed
    const allContracts = ns.bladeburner.getContractNames();
    const allOperations = ns.bladeburner.getOperationNames();
    const highStamina = 0.6;
    const lowStamina = 0.4;
    const preferredSuccessRate = 0.9;
    const chaosThreshold = 50;
    const minimumActionThreshold = 10;
    const averageActionThreshold = 20;

    ns.ui.openTail();
    let player = ns.getPlayer();
    let ownedAugments = ns.singularity.getOwnedAugmentations();
    while(!ownedAugments.includes("The Red Pill")){  // main bladeburner activity loop
        let stamina = getStaminaPercentage(ns);
        if (stamina > highStamina) {
            // prioritize operations if possible, then contracts, then recovery
            for(const operation of allOperations){
                if(averageSuccessRate(ns, "Operations", operation) > preferredSuccessRate){
                    ns.bladeburner.setTeamSize("Operations", operation, ns.bladeburner.getTeamSize());
                    ns.printf(`Started ${operation}! ${ns.bladeburner.startAction("Operations", operation)}`);
                    await ns.sleep(ns.bladeburner.getActionTime("Operations", operation));
                    break;
                }
            }
            for(const contract of allContracts){
                if(averageSuccessRate(ns, "Contracts", contract) > preferredSuccessRate){
                    ns.bladeburner.setTeamSize("Contracts", contract, ns.bladeburner.getTeamSize());
                    ns.printf(`Started ${contract}! ${ns.bladeburner.startAction("Contracts", contract)}`);
                    await ns.sleep(ns.bladeburner.getActionTime("Contracts", contract));
                    break;
                }
            }
        } else {
            ns.printf(`Stamina too low! ${stamina} ${ns.bladeburner.startAction("General", "Hyperbolic Regeneration Chamber")}`);
            while(stamina < lowStamina){
                await ns.bladeburner.nextUpdate();
            }
            while(stamina < highStamina){
                if(averageSuccessRate(ns, "General", "Recruitment") > preferredSuccessRate){
                    ns.printf(`Stamina still too low! ${stamina} ${ns.bladeburner.startAction("General", "Recruitment")}`);
                } else if(ns.bladeburner.getCityChaos(ns.bladeburner.getCity()) > chaosThreshold){
                    ns.printf(`Stamina still too low! ${stamina} ${ns.bladeburner.startAction("General", "Diplomacy")}`);
                } else{
                    ns.printf(`Stamina still too low! ${stamina} ${ns.bladeburner.startAction("General", "Training")}`);
                }
                await ns.bladeburner.nextUpdate();
            }
        }

        // Handle diplomacy/violence if chaos is too high or contracts too low
        let minActionNum = 100;
        let averageActionNum = 0;
        let totalActions = 0;
        for(const operation of allOperations){
            const actionsRemaining = ns.bladeburner.getActionCountRemaining("Operations", operation);
            if(actionsRemaining < minActionNum){
                minActionNum = actionsRemaining;
            }
            averageActionNum += actionsRemaining;
            totalActions++;
        }
        for(const contract of allContracts){
            const actionsRemaining = ns.bladeburner.getActionCountRemaining("Contracts", contract);
            if(actionsRemaining < minActionNum){
                minActionNum = actionsRemaining;
            }
            averageActionNum += actionsRemaining;
            totalActions++;
        }
        averageActionNum = averageActionNum / totalActions;
        if(averageActionNum < averageActionThreshold || minActionNum < minimumActionThreshold){
            if(ns.bladeburner.getCityChaos(ns.bladeburner.getCity()) < chaosThreshold){
                ns.printf(`Causing chaos! ${ns.bladeburner.startAction("General", "Incite Violence")}`);
            }
            else{
                ns.printf(`Gotta get out of here! ${ns.bladeburner.switchCity(findNewCity(ns, chaosThreshold))}`);
            }
        }

        // TODO Spend skill points automatically
        /*
        if (skillPoints() >= MIN_TO_SPEND) {
            upgradeSkillsPrioritized();
        }
        */

        // TODO need to also automate sleeve's bladeburners activities, not just player's

        await ns.bladeburner.nextUpdate();
    }
}