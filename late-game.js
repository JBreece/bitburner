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
        await ns.sleep(10000);
    }
    return;
}

export async function main(ns) {
    let player = ns.getPlayer();

    // purchase TOR router and all programs
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

    // run late game scripts
    runScript(ns, "auto-install-early-hack-template_v3.js", "home", 1);
    runScript(ns, "purchase-server-1tb.js", "home", 1);
    runScript(ns, "early-hack-template.js", "home", 1000);
    runScript(ns, "manager.js", "home", 1);
    if(ns.gang.inGang()){runScript(ns, "gang-management.js", "home", 1);}

    await waitForFaction(ns, "Sector-12","field");
    await waitForFaction(ns, "Daedalus","field");

    let currentFavor = ns.singularity.getFactionFavor("Daedalus");
    if(currentFavor >= ns.getFavorToDonate()){  // exit condition
        const requiredRep = ns.singularity.getAugmentationRepReq("The Red Pill");
        let currentRep = ns.singularity.getFactionRep("Daedalus");
        let repNeeded = requiredRep - currentRep;
        let repPerDollar = 0.0001 * (1 + currentFavor / 100);
        let donationNeeded = repNeeded / repPerDollar;
        while(player.money < donationNeeded){
            currentRep = ns.singularity.getFactionRep("Daedalus");
            repNeeded = requiredRep - currentRep;
            currentFavor = ns.singularity.getFactionFavor("Daedalus");
            repPerDollar = 0.0001 * (1 + currentFavor / 100);
            donationNeeded = repNeeded / repPerDollar;
            player = ns.getPlayer();
            await ns.sleep(10000);
        }
        ns.singularity.donateToFaction("Daedalus", donationNeeded);
        ns.singularity.purchaseAugmentation("Daedalus", "The Red Pill");
        ns.singularity.installAugmentations("finish-bn.js");  // exit this script, finish the BN
        return;
    }
    else{
        let neurofluxPrice = ns.singularity.getAugmentationPrice("Neuroflux Governor");
        while(player.money < (neurofluxPrice * 10)){
            player = ns.getPlayer();
            await ns.sleep(10000);
        }
        while(ns.singularity.purchaseAugmentation("Daedalus", "Neuroflux Governor")){
            await ns.sleep(10);
        }
        ns.singularity.installAugmentations("late-game.js");  // install & repeat until exit condition
    }
    return;
}