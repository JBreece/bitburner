/*
    Late game script to work up enough favor to purchase TRP
*/

function runScript(ns, scriptName, server, threadsNeeded, args){
    if(args){
        let execResult = ns.exec(scriptName, server, threadsNeeded, args);
        ns.print(`Started PID ${execResult} for ${scriptName} using ${threadsNeeded} threads on server ${server} with ${args} args`);
    }
    else{
        let execResult = ns.exec(scriptName, server, threadsNeeded);
        ns.print(`Started PID ${execResult} for ${scriptName} using ${threadsNeeded} threads on server ${server}`);
    }
    return;
}

async function waitForFaction(ns, faction, work){
    let player = ns.getPlayer();
    let myFactions = player.factions;
    while(!myFactions.includes(faction)){
        if((ns.singularity.checkFactionInvitations()).includes(faction)){
            ns.singularity.joinFaction(faction);
            ns.singularity.workForFaction(faction,work,true);
        }
        player = ns.getPlayer();
        myFactions = player.factions;
        ns.printf(`Not yet in faction! Waiting... ${faction} not in ${myFactions}`);
        await ns.sleep(10000);
    }
    return;
}

export async function main(ns) {
    ns.ui.openTail();
    let player = ns.getPlayer();

    // purchase TOR router and all programs
    if(!ns.hasTorRouter()){
        while(!ns.hasTorRouter()){
            if(player.money > 200000){
                ns.printf(`Purchased TOR router: ${ns.singularity.purchaseTor()}`);
                let darkWebPrograms = ns.singularity.getDarkwebPrograms();
                for(const program of darkWebPrograms){
                    ns.printf(`Purchased ${program}: ${ns.singularity.purchaseProgram(program)}`);
                }
            }
            await ns.sleep(2000);
        }
        runScript(ns, "early-hack-template.js", "home", 1000);
        await waitForFaction(ns, "Sector-12","field");
        await ns.sleep(20000);  // wait for some time for hacking level to grow a bit
        runScript(ns, "auto-install-early-hack-template_v3.js", "home", 1);
    }

    // run late game scripts
    runScript(ns, "purchase-server-max-ram.js", "home", 1);
    runScript(ns, "manager.js", "home", 1);
    runScript(ns, "sleeve-management.js", "home", 1);
    if(ns.gang.inGang()){runScript(ns, "gang-management.js", "home", 1);}

    await waitForFaction(ns, "Daedalus","field");
    let currentRep = ns.singularity.getFactionRep("Daedalus");
    let currentFavor = ns.singularity.getFactionFavor("Daedalus");
    if(currentFavor >= ns.getFavorToDonate()){  // exit condition
        const requiredRep = ns.singularity.getAugmentationRepReq("The Red Pill");
        currentRep = ns.singularity.getFactionRep("Daedalus");
        let repNeeded = requiredRep - currentRep;
        // const BNmultipliers = ns.getBitNodeMultipliers();  // required as each BN has different donation gains
        // let repPerDollar = 0.0001 * (1 + currentFavor / 100) * BNmultipliers.FactionWorkRepGain;
        // let donationNeeded = repNeeded / repPerDollar;
        let moneyRequired = ns.formulas.reputation.donationForRep(repNeeded, ns.getPlayer());
        while(player.money < moneyRequired){
            currentRep = ns.singularity.getFactionRep("Daedalus");
            repNeeded = requiredRep - currentRep;
            currentFavor = ns.singularity.getFactionFavor("Daedalus");
            // repPerDollar = 0.0001 * (1 + currentFavor / 100) * BNmultipliers.FactionWorkRepGain;
            // donationNeeded = repNeeded / repPerDollar;
            moneyRequired = ns.formulas.reputation.donationForRep(repNeeded, ns.getPlayer());
            player = ns.getPlayer();
            ns.printf(`Not enough money yet! ${player.money} < ${moneyRequired}`);
            await ns.sleep(10000);
        }
        ns.singularity.donateToFaction("Daedalus", moneyRequired);
        ns.singularity.purchaseAugmentation("Daedalus", "The Red Pill");
        ns.singularity.installAugmentations("finish-bn.js");  // exit this script, finish the BN
        return;
    }
    else{
        let neurofluxPrice = ns.singularity.getAugmentationPrice("NeuroFlux Governor");
        while(player.money < (neurofluxPrice * 10)){
            player = ns.getPlayer();
            neurofluxPrice = ns.singularity.getAugmentationPrice("NeuroFlux Governor");
            ns.printf(`Not enough money yet! ${player.money} < ${neurofluxPrice * 10}`);
            await ns.sleep(10000);
        }
        let neurofluxRep = ns.singularity.getAugmentationRepReq("NeuroFlux Governor");
        while(currentRep < (neurofluxRep * 5)){
            currentRep = ns.singularity.getFactionRep("Daedalus");
            neurofluxRep = ns.singularity.getAugmentationRepReq("NeuroFlux Governor");
            ns.printf(`Not enough rep yet! ${currentRep} < ${neurofluxRep * 5}`);
            await ns.sleep(100);
        }
        while(ns.singularity.purchaseAugmentation("Daedalus", "NeuroFlux Governor")){
            await ns.sleep(100);
        }
        ns.singularity.installAugmentations("late-game.js");  // install & repeat until exit condition
    }
    return;
}