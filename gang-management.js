/*
    * This automates gang activity in Bitburner.
    * It will manage gang members, assign tasks, and optimize their performance.
*/

export async function main(ns) {
    while(!ns.gang.inGang()){
        ns.printf("Not in a gang yet.\n");
        await ns.sleep(30000);
        // TODO: Update this to check if in a desired faction and if karma levels are good, then createGang()
    }
    if(ns.gang.inGang()){
        ns.ui.openTail();
        const allEquips = ns.gang.getEquipmentNames();
        while(true){
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
            const myPower = myGang.power;
            let warTime = false;
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
            
            // Luxury case - buy everything
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
    }
}