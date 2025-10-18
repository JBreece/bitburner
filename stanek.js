export async function main(ns) {
    ns.ui.openTail();
    while(!ns.stanek.acceptGift()){
        ns.printf("No Stanek gift available");
        await ns.sleep(60000);
    }
    ns.tprint("Stanek gift accepted!");
    const height = ns.stanek.giftHeight();
    const width = ns.stanek.giftWidth();
    // ns.printf(`Stanek grid is ${width} x ${height}`);
    const allFragments = ns.stanek.fragmentDefinitions();
    // ns.tprint(`Test allFragments ${JSON.stringify(allFragments)}`);
    for (const fragment of allFragments) {
        // ns.printf(`Fragment: ${JSON.stringify(fragment)}`);
        ns.printf("Fragment: id=%s | effect = %s | power=%s", fragment.id, fragment.effect, fragment.power);
    }
    while(true){
        for(let x = 0; x < width; x++){
            for(let y = 0; y < height; y++){
                //     if(ns.stanek.getFragment(x,y) && ns.stanek.getFragment(x,y).effect && !(ns.stanek.getFragment(x,y).effect).includes("adjacent fragment power")){
                //         await ns.stanek.chargeFragment(x,y);
                //         // ns.printf(`Charged fragment at ${x},${y}`);
                //     }
                // }
                const frag = ns.stanek.getFragment(x, y);
                if (!frag) continue; // no fragment
                if (frag.effect?.includes("adjacent fragment power")) continue; // booster fragment
                
                try {
                    await ns.stanek.chargeFragment(x, y);
                    // ns.printf(`Charged fragment at ${x},${y}`);
                } catch (err) {
                    // Just skip any fragment that can't be charged right now
                    ns.print(`Skipping (${x},${y}) due to error: ${err}`);
                }
            }
        }
        await ns.sleep(100);
    }
}