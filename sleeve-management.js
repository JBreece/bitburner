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

        await ns.sleep(10000);
    }
}