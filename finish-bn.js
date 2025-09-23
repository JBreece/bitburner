/*
    Finish it!
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
    const ownedAugments = ns.singularity.getOwnedAugmentations(false);
    if(ownedAugments.includes("The Red Pill")){
        // work up enough hacking xp to hack the world daemon.  Do this via running scripts etc.
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
            player = ns.getPlayer();
            await ns.sleep(2000);
        }

        // run end game scripts
        runScript(ns, "auto-install-early-hack-template_v3.js", "home", 1);
        runScript(ns, "purchase-server-max-ram.js", "home", 1);
        runScript(ns, "early-hack-template.js", "home", 1000);
        runScript(ns, "manager.js", "home", 1);
        await waitForFaction(ns, "Sector-12","hacking");

        const server = "w0r1d_d43m0n";
        const requiredHackingLevel = ns.getServerRequiredHackingLevel(server);
        while(ns.getHackingLevel() < requiredHackingLevel){
            await ns.sleep(10000);
        }

        // need to get root access first
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
        }
        else{
            let darkWebPrograms = ns.singularity.getDarkwebPrograms();
            for(const program of darkWebPrograms){
                ns.printf(`Purchased ${program}: ${ns.singularity.purchaseProgram(program)}`);
            }
        }
        ns.brutessh(server);
        ns.ftpcrack(server);
        ns.relaysmtp(server);
        ns.httpworm(server);
        ns.sqlinject(server);
        ns.nuke(server);

        // determine next bitnode  // TODO:  fix this.  This is broken.  Sent me to 1 even though I already completed it.
        const myPath = [1, 2, 5, 4, 10, 9, 3, 6, 7, 8, 12];  // note, excludes 11, 13, 14 in favor of leveling up the rest.  Do 11, 13, 14 manually.
        const owned = ns.singularity.getOwnedSourceFiles();
        const ownedMap = {};
        for (const sf of owned) {
            ownedMap[sf.n] = sf.l;  // Turn owned into a lookup { bitnode: level }
        }
        let nextBN = null;
        for (const bn of myPath) {
            const level = ownedMap[bn] ?? 0;
            if(bn === 1 && level < 3){  // prioritize SF1.3
                nextBN = bn;
                break;
            }
            if(bn === 4 && level < 3){  // need these singularity functions to be cheaper on RAM
                nextBN = bn;
                break;
            }
            if (level === 0) {
                nextBN = bn;
                break;
            } else {
                if (level < 2) {  // upgrade everything else
                    nextBN = bn;
                    break;
                }
            }
            if(bn === 12){
                nextBN = bn;
                break;
            }
        }
        if(nextBN === null){
            ns.printf(`No BN found! Defaulting to BN12`);
            nextBN = 12;
        }
        ns.toast(`Node destroyed! Going to ${nextBN} next.`, "success", 10000);
        ns.singularity.destroyW0r1dD43m0n(nextBN, "early-game.js");  // goodbye
    } else{ns.printf(`No Red Pill found! ${ownedAugments}`);}
}