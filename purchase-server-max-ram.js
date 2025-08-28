/** @param {NS} ns */
export async function main(ns) {
    // How much RAM each purchased server will have. In this case, it'll
    // be 8GB.
    const ram = ns.getPurchasedServerMaxRam();
    let myScript = "grow-stock.js";

    // Iterator we'll use for our loop
    let i = 0;

    // Continuously try to purchase servers until we've reached the maximum
    // amount of servers
    while (i < ns.getPurchasedServerLimit()) {
        // Check if we have enough money to purchase a server
        const myMoney = ns.getServerMoneyAvailable("home");
        if (myMoney > ns.getPurchasedServerCost(ram) && myMoney > 1000000000) {
            // If we have enough money, then:
            //  1. Purchase the server
            //  2. Copy our hacking script onto the newly-purchased server
            //  3. Run our hacking script on the newly-purchased server with n threads
            //  4. Increment our iterator to indicate that we've bought a new server
            let hostname = ns.purchaseServer("pserv-" + i, ram);
            if(i % 2 > 0){
              myScript = "grow-stock.js";
            }
            else{
              myScript = "early-hack-template.js"
            }
            if(hostname){
            ns.scp(myScript, hostname);
            const scriptRam = ns.getScriptRam(myScript, hostname);
            ns.tprint(`scriptRam = ${scriptRam}`);
            const serverRam = ns.getServerMaxRam(hostname);
            ns.tprint(`serverRam = ${serverRam}`);
            const threadCount = Math.floor(serverRam / scriptRam);
            ns.tprint(`threaCount = ${threadCount}`);
            ns.exec(myScript, hostname, threadCount);
            ++i;
            }
            else{
              return;
            }
        }
        //Make the script wait for a second before looping again.
        //Removing this line will cause an infinite loop and crash the game.
        await ns.sleep(1000);
    }
}