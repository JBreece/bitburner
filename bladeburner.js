export async function main(ns) {
    while(!ns.inBladeburner()){
        ns.joinBladeburnerDivision();
        ns.sleep(10000);
    }
    ns.ui.openTail();
    let player = ns.getPlayer();
    let ownedAugments = ns.singularity.getOwnedAugmentations();
    while(!ownedAugments.includes("The Red Pill")){

        // rest of the code for bladeburner activity here
        

        // TODO need to also automate sleeve's bladeburners activities, not just player's

        ns.bladeburner.nextUpdate();
    }
}