/** @param {NS} ns */
export async function main(ns) {
    // Defines the "target server", which is the server
    // that we're going to hack. In this case, it's "n00dles"
    /*  TODO make the target based on hacking level and top money.
    const playerHackingLevel = ns.getHackingLevel();
    if((hackLevel * 2) < playerHackingLevel){
      
    }
    */
    const target = "joesguns";

    // Infinite loop that continously grows the target server
    while(true) {
      await ns.grow(target)
    }
}