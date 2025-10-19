/** @param {NS} ns */
export async function main(ns) {

    /* pseudocode:
        // run weaken.js [joesguns]  // on "home" server, with max threads
        // this should be done outside of this script, and we should remove 'home' from every other script that kills and runs scripts

        if(moneyAvailable < 10)
        {
            sell all short stock in joesguns
            buy all possible long stock in joesguns
            run find-all-servers.js  // with 1 thread.  This kills all scripts in every server.
            run stock-manipulate.js [grow.js] [joesguns]
        }
        else if(moneyAvailable == maxMoneyForServer)
        {
            sell all long stock in joesguns
            buy all possible short stock in joesguns
            run find-all-servers.js  // with 1 thread.  This kills all scripts in every server.
            run stock-manipulate.js [hack.js] [joesguns]
        }
    */

    const targetServer = arg[0];  // e.g., "joesguns"
    ns.exec(s, server, threadsNeeded, target)
}