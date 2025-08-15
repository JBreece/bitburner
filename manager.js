/* 
    Manager.js schedules grow, weaken, and hack scripts across multiple servers.
    This allows coordinated attacks on multiple servers, ensuring the following:
    1. "Grow" threads are only run on targets that are not at max money.
    2. "Weaken" threads are run on targets above the minimum security level.
    3. "Hack" threads are run on targets that have sufficient money and below the security threshold.
    4. Hacking is spread across multiple targets for efficiency.
*/

export async function main(ns) {
    const activeTasks = [];
    ns.ui.openTail();
    while(true){
        // Clean up finished tasks
        const now = Date.now();
        for (let i = activeTasks.length - 1; i >= 0; i--) {
            if (activeTasks[i].expectedTime < now) {
                activeTasks.splice(i, 1); // Remove finished task
            }
        }

        // First, determine the target and find out what task is required next (grow, weaken, or hack)
        let currentTargets = [];
        const targeted = new Set();
        const acceptableMoneyLevel = 1000000; // TODO: make this dynamic
        const acceptableSecurityLevel = 25; // TODO: make this dynamic
        function getTarget(server, depth = 0){
            targeted.add(server);
            if(ns.getServerMinSecurityLevel(server) < acceptableSecurityLevel
            && ns.getServerMaxMoney(server) > acceptableMoneyLevel){
                currentTargets.push(server);
            }
            const neighbors = ns.scan(server);
            for (const neighbor of neighbors) {
              if (!targeted.has(neighbor)) {
                  getTarget(neighbor, depth + 1);
              }
            }
        }
        getTarget('home');
        //ns.print(`Current targets: ${currentTargets}`);

        // Find an available servers I can use (including purchased servers and home) based on available RAM
        let availableServers = ["home"];
        const purchasedServers = ns.getPurchasedServers();
        for(const server of purchasedServers){
            availableServers.push(server);
            ns.scp("weaken.js", server);
            ns.scp("grow.js", server);
            ns.scp("hack.js", server);
        }
        const foundServers = new Set();
        function findServers(server, depth = 0){
            foundServers.add(server);
            availableServers.push(server);
            const neighbors = ns.scan(server);
            for (const neighbor of neighbors) {
                if (!foundServers.has(neighbor)) {
                    findServers(neighbor, depth + 1);
                    if(ns.getServerMaxRam(neighbor) >= 8 // at least 8GB RAM
                    && ns.hasRootAccess(neighbor) // we have root access
                    && !availableServers.includes(neighbor) // not already in the list
                    && !neighbor.includes("pserv-")){ // not a purchased server
                        ns.scp("weaken.js", neighbor);
                        ns.scp("grow.js", neighbor);
                        ns.scp("hack.js", neighbor);
                    }
                }
            }
        }
        findServers('home');
        /*
        for(const availableServer of availableServers){
          ns.tprint(`${availableServer} | ${ns.getServerMaxRam(availableServer)} | ${ns.hasRootAccess(availableServer)}}`)
        }
        */

        // Now, for each target, determine the task to run and how many threads to use
        for(const target of currentTargets){
            // Check if the target is already being worked on
            const foundTask = activeTasks.find(name => name.targetName === target);
            const currentActiveTask = foundTask ? foundTask.task : null;
            if(currentActiveTask === "grow" || currentActiveTask === "weaken" || currentActiveTask === "hack"){
                ns.print(`Skipping ${target} as it already has an active task: ${currentActiveTask}`);
                continue; // Skip if there's already an active task
            }

            // Determine the task to run based on the server's state
            if(ns.getServerSecurityLevel(target) > ns.getServerMinSecurityLevel(target)){
                activeTasks.push({targetName: target, task: "weaken", expectedTime: 1});
            }
            else if(ns.getServerMoneyAvailable(target) < ns.getServerMaxMoney(target)){
                activeTasks.push({targetName: target, task: "grow", expectedTime: 1});
            }
            else if(ns.getServerMoneyAvailable(target) >= acceptableMoneyLevel && ns.getServerSecurityLevel(target) <= acceptableSecurityLevel){
                activeTasks.push({targetName: target, task: "hack", expectedTime: 1});
            }
            else {
                ns.print(`No suitable task for ${target}. Security: ${ns.getServerSecurityLevel(target)}, Money: ${ns.getServerMoneyAvailable(target)}`);
            }

            let threadsNeeded = 1; // Safe default value
            // Calculate needed threads for the task
            if(ns.fileExists("Formulas.exe", "home")){
                const player = ns.getPlayer();
                if(activeTasks[activeTasks.length - 1].task === "weaken"){
                    const secDiff = ns.getServerSecurityLevel(target) - ns.getServerMinSecurityLevel(target);
                    for(let i = 0; i < 100000; i++){  // TODO: find a better max thread count than 100000
                        if(ns.weakenAnalyze(i) > secDiff){
                            threadsNeeded = i;
                            break; // Stop once we find the first sufficient thread count
                        }
                        //else{ns.tprint(`weakenAnalyze(${i}) = ${ns.weakenAnalyze(i)} is not sufficient for secDiff ${secDiff}`);}
                    }
                }
                else if(activeTasks[activeTasks.length - 1].task === "grow"){
                    const moneyDiff = ns.getServerMaxMoney(target) / ns.getServerMoneyAvailable(target);
                    threadsNeeded = Math.ceil(ns.formulas.hacking.growThreads(ns.getServer(target), player, moneyDiff));
                    /*  NOTE: may be unnecessary, but also needs to be fixed.  'growSecurity' and 'weakenThreads' are not functions.
                    // Calculate additional weaken threads needed due to grow's security increase
                    const growSecIncrease = ns.formulas.hacking.growSecurity(threadsNeeded, player);
                    const additionalWeakenThreads = Math.ceil(ns.formulas.hacking.weakenThreads(growSecIncrease, player));
                    // Add a weaken task to the queue
                    if(additionalWeakenThreads > 0){
                        activeTasks.push({targetName: target, task: "weaken", expectedTime: 1});
                        ns.print(`Added additional weaken task for ${target} with ${additionalWeakenThreads} threads due to grow's security increase.`);
                    }
                    */
                }
                else if(activeTasks[activeTasks.length - 1].task === "hack"){
                    const hackPercent = ns.formulas.hacking.hackPercent(ns.getServer(target), player);
                    for(let i = 0; i < 100000; i++){  // TODO: find a better max thread count than 100000
                        if(hackPercent > 0 && hackPercent * i > 0.5){
                            threadsNeeded = i;
                            break; // Stop once we find the first sufficient thread count
                        }
                        //else{ns.tprint(`hackPercent(${i}) = ${hackPercent} is not sufficient for 0.5 / hackPercent`);}
                    }
                    /*  NOTE: may be unnecessary, but also needs to be fixed.  'growSecurity' and 'weakenThreads' are not functions.
                    // Calculate additional weaken threads needed due to hack's security increase
                    const hackSecIncrease = ns.formulas.hacking.hackSecurity(threadsNeeded, player);
                    const additionalWeakenThreads = Math.ceil(ns.formulas.hacking.weakenThreads(hackSecIncrease, player));
                    // Add a weaken task to the queue
                    if(additionalWeakenThreads > 0){
                        activeTasks.push({targetName: target, task: "weaken", expectedTime: 1});
                        ns.print(`Added additional weaken task for ${target} with ${additionalWeakenThreads} threads due to hack's security increase.`);
                    }
                    */
                }
                activeTasks[activeTasks.length - 1].threadsNeeded = threadsNeeded;
                ns.print(`Calculated ${threadsNeeded} threads needed for ${activeTasks[activeTasks.length - 1]}`);
            }
            if(threadsNeeded <= 0){threadsNeeded = 1;} // Ensure at least 1 thread is used, even if no threads are needed
            /*  Possible alternative for skipping tasks instead of using 1 thread as a default
            if(threadsNeeded <= 0){
                ns.print(`No threads needed for ${target}. Skipping.`);
                continue; // Skip if no threads are needed
            }
            */

            // Now, schedule the task on available servers
            const serverInfo = [];
            for(const server of availableServers){
                const maxRam = ns.getServerMaxRam(server);
                const usedRam = ns.getServerUsedRam(server);
                const freeRam = maxRam - usedRam;
                serverInfo.push({hostname: server, maxRam: maxRam, usedRam: usedRam, freeRam: freeRam});
                const scriptName = activeTasks[activeTasks.length - 1].task + ".js";
                let threadSize = ns.getScriptRam(scriptName, server);
                let threadsUsable = Math.floor(freeRam / threadSize);
                // Set expectedTime only if we will actually schedule the task
                if (threadsUsable > 0 && threadsUsable != Infinity && threadsUsable > (threadsNeeded * 1.1)) {
                    let task = activeTasks[activeTasks.length - 1].task;
                    let expectedTime = Date.now() + (
                        task === "weaken" ? ns.getWeakenTime(target) :
                        task === "grow" ? ns.getGrowTime(target) :
                        ns.getHackTime(target)
                    );
                    activeTasks[activeTasks.length - 1].expectedTime = expectedTime;
                    // Schedule the task on this server
                    const scriptName = task + ".js";
                    ns.scp(scriptName, server);
                    const execResult = ns.exec(scriptName, server, threadsNeeded, target);
                    //ns.tprint(`exec = ${execResult} script ${scriptName} server ${server} threadsNeeded ${threadsNeeded} target ${target}`);
                    ns.print(`Started ${task} on ${target} using ${threadsNeeded} threads on server ${server}`);
                    if(execResult != 0)
                      break; // Move to the next target after scheduling
                }
                //else
                  //ns.print(`server ${server} threadsNeeded = ${threadsNeeded} threadSize = ${threadSize} freeRam = ${freeRam}`);
            }
            //ns.print(`Available servers: ${JSON.stringify(serverInfo)}`);     
        }
        await ns.sleep(1000); // Allow time for the tasks to be scheduled
    }
}

