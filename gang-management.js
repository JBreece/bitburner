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
    while(!ns.gang.inGang()){
        ns.printf("Not in a gang yet.\n");
        await ns.sleep(30000);
        // TODO: Update this to check if in a desired faction and if karma levels are good, then createGang()
    }
    if(ns.gang.inGang()){
        ns.ui.openTail();
        const allEquips = ns.gang.getEquipmentNames();
        const combatEquips = ns.gang.getEquipmentNames();
        const combatEquipsSorted = ["Baseball Bat"];
        for(const equip of allEquips){  // remove non-combat equips from combatEquips
            if(ns.gang.getEquipmentType(equip) == "Rootkit" || ns.gang.getEquipmentType(equip) == "Vehicle"){
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
            const maxEquipmentCost = 100000000;  // TODO: make this dynamic
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
                        ns.gang.purchaseEquipment(member, "Baseball Bat");  // TODO: make this dynamic
                    }
            }

            // Recruit new members
            if(ns.gang.getRecruitsAvailable() > 0){  // TODO: make this a while() loop, naming convention is wrong since thugs can die.
                let numberOfMembers = 0;
                for(const member of members){
                    numberOfMembers++;
                }
                const newMemberName = "thug" + (numberOfMembers + 1);
                ns.tprint(`Recruited ${newMemberName}! ${ns.gang.recruitMember(newMemberName)}`);
                ns.gang.purchaseEquipment(newMemberName, "Baseball Bat");  // TODO: make this dynamic
                ns.gang.setMemberTask(newMemberName, "Train Combat");  // TODO: make this dynamic
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
            }
            
            // Luxury case - buy everything
            if(myMoney > 10000000000){
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

            // Purchase equipment
            if(myMoney > 10000000){
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