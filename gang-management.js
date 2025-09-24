/*
    * This automates gang activity in Bitburner.
    * It will manage gang members, assign tasks, and optimize their performance.
*/

// helper function for moving indices within an array
function array_move(arr, old_index, new_index) {
    if (new_index >= arr.length) {
        var k = new_index - arr.length + 1;
        while (k--) {
            arr.push(undefined);
        }
    }
    arr.splice(new_index, 0, arr.splice(old_index, 1)[0]);
};

export async function main(ns) {
    // if not in a gang, wait until you are. Commit crime in the meantime.
    let karma = "";
    while(!ns.gang.inGang()){
        ns.printf("Not in a gang yet.\n");
        await ns.sleep(30000);
        karma = ns.heart.break().toFixed(2);
        if(karma < -54000){
            while(!ns.singularity.joinFaction("Slum Snakes")){
                ns.singularity.commitCrime("Homicide");  // only homicide if karma is ready but not in slum snakes for some reason
                await ns.sleep(30000);
            }
            if(ns.gang.createGang()){break;}
            else{ns.alert("error in gang-management");}
        }
    }
    if(ns.gang.inGang()){
        ns.ui.openTail();
        const allEquips = ns.gang.getEquipmentNames();
        const combatEquips = ns.gang.getEquipmentNames();
        const combatEquipsSorted = ["Baseball Bat"];
        for(const equip of allEquips){  // remove non-combat equips from combatEquips
            const type = ns.gang.getEquipmentType(equip);
            if(type == "Rootkit" || type == "Vehicle" || type == "Augmentation"){
                combatEquips.splice(combatEquips.indexOf(equip), 1);
            }
        }
        for(const equip of combatEquips){
            combatEquipsSorted.push(equip);
            while(ns.gang.getEquipmentCost(combatEquipsSorted.indexOf(equip) - 1) < ns.gang.getEquipmentCost(combatEquipsSorted.indexOf(equip))){
                array_move(combatEquipsSorted, indexOf(equip), indexOf(equip) - 2);
            }
        }
        while(true){
            const myMoney = ns.getServerMoneyAvailable("home");
            const members = ns.gang.getMemberNames();
            const duration = await ns.gang.nextUpdate();
            const maxEquipmentCost = myMoney / 10;
            const myGang = ns.gang.getGangInformation();
            const myGangName = myGang.faction;
            const otherGangs = ns.gang.getOtherGangInformation();
            delete otherGangs[myGangName];
            const comfortZone = 1.2;
            ns.printf(`Gang completed ${ns.tFormat(duration)} of activity.`);
            ns.printf(`Bonus time remaining: ${ns.tFormat(ns.gang.getBonusTime())}`);

            // Ascension check
            for(const member of members){
                //const memberInfo = ns.gang.getMemberInformation(member);  // Unnecessary for now - not needed for ascension check.
                //const agility = memberInfo.agi_asc_mult;  // same as above.
                const memberAscension = ns.gang.getAscensionResult(member);
                if(!memberAscension) continue;
                const weightedAverage = (memberAscension.agi * 1  // change multiplier here if needed
                    + memberAscension.def * 1
                    + memberAscension.dex * 1
                    + memberAscension.str * 1) / 4;  // divide by number of ascension factors
                if(weightedAverage > 1.3){
                        ns.tprint(`Member ${member} has ascended! ${JSON.stringify(ns.gang.ascendMember(member))}`);
                        ns.printf(`Member ${member} has ascended! ${JSON.stringify(ns.gang.ascendMember(member))}`);
                        ns.gang.purchaseEquipment(member, "Baseball Bat");
                        ns.gang.setMemberTask(member, "Train Combat");
                    }
            }

            // Recruit new members
            if(ns.gang.getRecruitsAvailable() > 0){
                let newMemberName = "thug";
                for(let i = 1; i < (members.length + 2); i++){
                    newMemberName = "thug" + i;
                    if(ns.gang.recruitMember(newMemberName)){
                        ns.tprint(`Recruited ${newMemberName}!`);
                        ns.gang.purchaseEquipment(newMemberName, "Baseball Bat");
                        ns.gang.setMemberTask(newMemberName, "Train Combat");
                        break;
                    }
                }
            }

            // Territory clashes
            const warringEnabled = myGang.territoryWarfareEngaged;
            const myPower = myGang.power;
            let warTime = false;
            if(warringEnabled == true){
                for(const [otherGang, otherInfo] of Object.entries(otherGangs)){
                    if((otherInfo.power * comfortZone) > myPower){
                        ns.tprint(`${otherGang} is getting too close to us in power.`);
                        warTime = true;
                    }
                }
                if(warTime){
                    for(const member of members){
                        ns.gang.setMemberTask(member, "Territory Warfare");
                    }
                }
                else{
                    for(const member of members){
                        if(member.slice(4) % 5 == 0){ns.gang.setMemberTask(member, "Territory Warfare");}
                        else if(member.slice(4) % 6 == 0){ns.gang.setMemberTask(member, "Vigilante Justice");}
                        else{ns.gang.setMemberTask(member, "Human Trafficking");}
                    }
                }

                // overwrite previous instructions if need to train combat first
                for(const member of members){
                    const memberAscension = ns.gang.getAscensionResult(member);
                    if(!memberAscension){
                        ns.gang.setMemberTask(member, "Train Combat");
                        continue;
                    }
                    const weightedAverage = (memberAscension.agi * 1  // change multiplier here if needed
                        + memberAscension.def * 1
                        + memberAscension.dex * 1
                        + memberAscension.str * 1) / 4;  // divide by number of ascension factors
                    if(weightedAverage < 1.05){
                        ns.gang.setMemberTask(member, "Train Combat");
                    }
                }
            }
            
            /*  commenting this out for now - I'm rethinking this strategy.  Might revisit.
            // Luxury case - buy everything
            if(myMoney > 1000000000){
                for(const member of members){
                    const memberDetails = ns.gang.getMemberInformation(member);
                    const memberEquips = memberDetails.upgrades;
                    const needToBuy = [];
                    for(const equip of allEquips){
                        if(!memberEquips.includes(equip) && ns.gang.getEquipmentCost(equip) < maxEquipmentCost){
                            needToBuy.push(equip);
                        }
                    }
                    for(const equip of needToBuy){
                        ns.gang.purchaseEquipment(member, equip);
                    }
                }
            }
            */

            // Purchase equipment
            if(myMoney > 1000000){
                for(const equip of combatEquipsSorted){
                    for(const member of members){
                        const memberDetails = ns.gang.getMemberInformation(member);
                        const memberEquips = memberDetails.upgrades;
                        if(memberEquips.includes(equip)){
                            ns.printf(`${member} already owns ${equip}`);
                        }
                        else if(ns.gang.getEquipmentCost(equip) > maxEquipmentCost){
                            ns.printf(`${equip} is too expensive!`)
                        }
                        else{
                            ns.gang.purchaseEquipment(member, equip);
                            ns.printf(`purchased ${equip} for ${member}`);
                        }
                    }
                }
            }
        }
    }
}