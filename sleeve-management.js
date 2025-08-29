/*
    * This automates sleeve activity in Bitburner.
    * It will manage sleeves, assign tasks, and optimize their performance.
*/

export async function main(ns) {
    ns.ui.openTail();
    while(true){
        let numSleeves = ns.sleeve.getNumSleeves();
        let mySleeves = [];
        let myGym = "Powerhouse Gym";  // TODO: make this dynamic
        for(let i = 0; i < numSleeves; i++){
            mySleeves.push(ns.sleeve.getSleeve(i));
        }

        // while shock is greater than 20, reduce shock
        for(let i = 0; i < numSleeves; i++){
            if(mySleeves[i].shock > 20){ns.sleeve.setToShockRecovery(i);}
        
        // while any of the 4 combat stats are less than 70, train stats
            if(mySleeves[i].shock <= 20){
                if(mySleeves[i].skills.strength < 70){ns.sleeve.setToGymWorkout(i, myGym, "strength");}
                if(mySleeves[i].skills.defense < 70){ns.sleeve.setToGymWorkout(i, myGym, "defense");}
                if(mySleeves[i].skills.dexterity < 70){ns.sleeve.setToGymWorkout(i, myGym, "dexterity");}
                if(mySleeves[i].skills.agility < 70){ns.sleeve.setToGymWorkout(i, myGym, "agility");}
            }

        // do crime for negative karma
            if(mySleeves[i].shock <= 20
                && mySleeves[i].skills.strength >= 70
                && mySleeves[i].skills.defense >= 70
                && mySleeves[i].skills.dexterity >= 70
                && mySleeves[i].skills.agility >= 70){
                    ns.sleeve.setToCommitCrime(i, "Homicide");
                }

            ns.printf(`Sleeve ${i} set to ${JSON.stringify(ns.sleeve.getTask(i))}!`);
        }

        if(ns.getRunningScript("late-game.js", "home") != null){
            while(ns.getRunningScript("late-game.js", "home") != null){
                let player = ns.getPlayer();
                let myFactions = player.factions;
                const faction = "Daedalus";  // in the case of late game sleeve management, faction is only Daedalus
                // check to make sure we're actually in Daedalus
                if(!myFactions.includes(faction)){
                    while(!myFactions.includes(faction)){
                        if((ns.singularity.checkFactionInvitations()).includes(faction)){
                            ns.singularity.joinFaction(faction);
                        }
                        player = ns.getPlayer();
                        myFactions = player.factions;
                        ns.printf(`Not yet in faction! Waiting... ${faction} not in ${myFactions}`);
                        await ns.sleep(10000);
                    }
                }
                // assign sleeves to work for Daedalus
                for(let i = 0; i < numSleeves; i++){
                    if((ns.sleeve.getTask(i)).type != "FACTION" && (ns.sleeve.getTask(i)).factionName != faction){
                        ns.sleeve.setToFactionWork(i, faction, "field");
                        ns.printf(`Sleeve ${i} set to ${JSON.stringify(ns.sleeve.getTask(i))}!`);
                    }
                }
                await ns.sleep(10000);
            }
        }
        await ns.sleep(10000);
    }

}