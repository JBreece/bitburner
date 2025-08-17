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
        while(true){
            const duration = await ns.gang.nextUpdate();
            ns.printf(`Gang completed ${ns.tFormat(duration)} of activity.`);
            ns.printf(`Bonus time remaining: ${ns.tFormat(ns.gang.getBonusTime())}`);

            // Ascension check
            const members = ns.gang.getMemberNames();
            for(const member of members){
                //const memberInfo = ns.gang.getMemberInformation(member);  // Unnecessary for now - not needed for ascension check.
                //const agility = memberInfo.agi_asc_mult;  // same as above.
                const memberAscension = ns.gang.getAscensionResult(member);
                if(!memberAscension) continue;
                if(memberAscension.agi > 2
                    && memberAscension.agi > 2
                    && memberAscension.def > 2
                    && memberAscension.dex > 2
                    && memberAscension.str > 2){
                        ns.tprint(`Member ${member} has ascended! ${ns.gang.ascendMember(member)}`);
                        ns.printf(`Member ${member} has ascended! ${ns.gang.ascendMember(member)}`);
                    }
            }
        }
    }
}