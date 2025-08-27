/*
    This script is meant for when you're starting a new Bitnode.
*/

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
    ns.printf(`Welcome to ${(ns.getPlayer()).bitNodeN}`);
    ns.tprint(`Welcome to ${(ns.getPlayer()).bitNodeN}`);
    ns.ui.openTail();
    const earlyGameMoneyThreshold = 200000;

    // run early game scripts
    // TODO: refactor this with a function
    let scriptName = "sleeve-management.js";
    let server = "home";
    let threadsNeeded = 1;
    let execResult = ns.exec(scriptName, server, threadsNeeded);
    ns.print(`Started PID ${execResult} for ${scriptName} using ${threadsNeeded} threads on server ${server}`);

    scriptName = "auto-install-early-hack-template.js";
    server = "home";
    threadsNeeded = 1;
    execResult = ns.exec(scriptName, server, threadsNeeded);
    ns.print(`Started PID ${execResult} for ${scriptName} using ${threadsNeeded} threads on server ${server}`);
    
    scriptName = "early-hack-template.js";
    server = "home";
    threadsNeeded = 10;
    execResult = ns.exec(scriptName, server, threadsNeeded);
    ns.printf(`Started PID ${execResult} for ${scriptName} using ${threadsNeeded} threads on server ${server}`);

    // start committing Shoplift
        // optionally, scale this based on % chance of success of future crimes and change crimes as needed
    let crime = "Shoplift";
    ns.singularity.commitCrime(crime, true);

    // run purchase-server-8gb.js  TODO - find a place to put this.

    // buy and upgrade hacknet nodes until we can buy TOR router
    while(ns.getPlayer().money < earlyGameMoneyThreshold){
        scriptName = "hacknet.js";
        server = "home";
        threadsNeeded = 1;
        if(!ns.isRunning(scriptName, server, earlyGameMoneyThreshold)){
            execResult = ns.exec(scriptName, server, threadsNeeded, earlyGameMoneyThreshold);
        }
        await ns.sleep(1000);
    }

    // buy TOR router and BruteSSH.exe
    ns.printf(`Purchased TOR router: ${ns.singularity.purchaseTor()}`);
    ns.printf(`Purchased BruteSSH.exe: ${ns.singularity.purchaseProgram("BruteSSH.exe")}`);
    scriptName = "auto-install-early-hack-template.js";
    server = "home";
    threadsNeeded = 1;
    execResult = ns.exec(scriptName, server, threadsNeeded);
    ns.printf(`Started PID ${execResult} for ${scriptName} using ${threadsNeeded} threads on server ${server}`);

    let player = ns.getPlayer();
    let myFactions = player.factions;
    while(!myFactions.includes("Slum Snakes")){
        //check if each of these is available, and if so, buy them
        if(!ns.fileExists("FTPCrack.exe")){
            ns.printf(`Purchased FTPCrack.exe: ${ns.singularity.purchaseProgram("FTPCrack.exe")}`);
            scriptName = "auto-install-early-hack-template_v3.js";
            server = "home";
            threadsNeeded = 1;
            execResult = ns.exec(scriptName, server, threadsNeeded);
            ns.printf(`Started PID ${execResult} for ${scriptName} using ${threadsNeeded} threads on server ${server}`);
        }
        if(!ns.fileExists("relaySMTP.exe")){
            ns.printf(`Purchased relaySMTP.exe: ${ns.singularity.purchaseProgram("relaySMTP.exe")}`);
            scriptName = "auto-install-early-hack-template_v3.js";
            server = "home";
            threadsNeeded = 1;
            execResult = ns.exec(scriptName, server, threadsNeeded);
            ns.printf(`Started PID ${execResult} for ${scriptName} using ${threadsNeeded} threads on server ${server}`);
        }
        if(!ns.fileExists("HTTPWorm.exe")){
            ns.printf(`Purchased HTTPWorm.exe: ${ns.singularity.purchaseProgram("HTTPWorm.exe")}`);
            scriptName = "auto-install-early-hack-template_v3.js";
            server = "home";
            threadsNeeded = 1;
            execResult = ns.exec(scriptName, server, threadsNeeded);
            ns.printf(`Started PID ${execResult} for ${scriptName} using ${threadsNeeded} threads on server ${server}`);
        }
        if(!ns.fileExists("SQLInject.exe")){
            ns.printf(`Purchased SQLInject.exe: ${ns.singularity.purchaseProgram("SQLInject.exe")}`);
            scriptName = "auto-install-early-hack-template_v3.js";
            server = "home";
            threadsNeeded = 1;
            execResult = ns.exec(scriptName, server, threadsNeeded);
            ns.printf(`Started PID ${execResult} for ${scriptName} using ${threadsNeeded} threads on server ${server}`);
        }
        
        // buy some 1tb servers
        if(ns.getPlayer().money > (ns.getPurchasedServerCost(1024) * 5)){
            scriptName = "purchase-server-1tb.js";
            server = "home";
            threadsNeeded = 1;
            execResult = ns.exec(scriptName, server, threadsNeeded);
            ns.printf(`Started PID ${execResult} for ${scriptName} using ${threadsNeeded} threads on server ${server}`);
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