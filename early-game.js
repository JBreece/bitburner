/*
    This script is meant for when you're starting a new Bitnode.
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

export async function main(ns) {
    ns.printf(`Welcome to ${ns.getResetInfo().currentNode}`);
    ns.tprint(`Welcome to ${ns.getResetInfo().currentNode}`);
    ns.ui.openTail();
    const earlyGameMoneyThreshold = 200000;
    let player = ns.getPlayer();
    let myFactions = player.factions;

    // run early game scripts
    runScript(ns, "sleeve-management.js", "home", 1);
    runScript(ns, "auto-install-early-hack-template.js", "home", 1);
    runScript(ns, "early-hack-template.js", "home", 8);

    // start committing Shoplift
        // optionally, scale this based on % chance of success of future crimes and change crimes as needed
    let crime = "Shoplift";
    ns.singularity.commitCrime(crime, true);

    // buy and upgrade hacknet nodes until we can buy TOR router
    runScript(ns, "hacknet.js", "home", 1, earlyGameMoneyThreshold);
    while(player.money < earlyGameMoneyThreshold){
        runScript(ns, "hacknet.js", "home", 1, earlyGameMoneyThreshold);
        player = ns.getPlayer();
        await ns.sleep(1000);
    }

    // buy TOR router and BruteSSH.exe
    ns.printf(`Purchased TOR router: ${ns.singularity.purchaseTor()}`);
    while(!ns.fileExists("FTPCrack.exe")){
        ns.printf(`Purchased BruteSSH.exe: ${ns.singularity.purchaseProgram("BruteSSH.exe")}`);
        await ns.sleep(1000);
    }
    runScript(ns, "auto-install-early-hack-template.js", "home", 1);
    runScript(ns, "purchase-server-8gb.js", "home", 1);

    while(!myFactions.includes("Slum Snakes")){
        //check if each of these is available, and if so, buy them
        while(!ns.fileExists("FTPCrack.exe")){
            ns.printf(`Purchased FTPCrack.exe: ${ns.singularity.purchaseProgram("FTPCrack.exe")}`);
            await ns.sleep(10000);
        }
        runScript(ns, "auto-install-early-hack-template_v3.js", "home", 1);  // re-run after each darkweb program purchased
        while(!ns.fileExists("relaySMTP.exe")){
            ns.printf(`Purchased relaySMTP.exe: ${ns.singularity.purchaseProgram("relaySMTP.exe")}`);
            await ns.sleep(10000);
        }
        runScript(ns, "auto-install-early-hack-template_v3.js", "home", 1);
        while(!ns.fileExists("HTTPWorm.exe")){
            ns.printf(`Purchased HTTPWorm.exe: ${ns.singularity.purchaseProgram("HTTPWorm.exe")}`);
            await ns.sleep(10000);
        }
        runScript(ns, "auto-install-early-hack-template_v3.js", "home", 1);
        while(!ns.fileExists("SQLInject.exe")){
            ns.printf(`Purchased SQLInject.exe: ${ns.singularity.purchaseProgram("SQLInject.exe")}`);
            await ns.sleep(10000);
        }
        runScript(ns, "auto-install-early-hack-template_v3.js", "home", 1);
        
        // buy some 1tb servers
        while(player.money < (ns.getPurchasedServerCost(1024) * 5)){
            runScript(ns, "purchase-server-1tb.js", "home", 1);
            player = ns.getPlayer();
            await ns.sleep(10000);
        }
        
        // sector-12 field work vs homicide check
        if(ns.singularity.getCrimeChance("Homicide") > 20 && !myFactions.includes("Sector-12"))
            ns.singularity.commitCrime("Homicide", true);
        if(ns.singularity.getCrimeChance("Homicide") < 20 && !myFactions.includes("Sector-12") && (ns.singularity.checkFactionInvitations()).includes("Sector-12")){
            ns.singularity.joinFaction("Sector-12");
            ns.singularity.workForFaction("Sector-12","field",true);
        }
        if(ns.singularity.getCrimeChance("Homicide") > 80)
            ns.singularity.commitCrime("Homicide", true);

        // check if our karma is at -54000, and if so, join Slum Snakes and create a gang - this marks end of early game
        if(ns.heart.break().toFixed(2) < -54000){
            ns.singularity.joinFaction("Slum Snakes");
            ns.gang.createGang("Slum Snakes");
            ns.printf(`Created a gang. End of early game, exiting script.`);
            ns.tprint(`Created a gang. End of early game, exiting script.`);
            return;
        }
        
        myFactions = player.factions;
        await ns.sleep(10000);
    }
}