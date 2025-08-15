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
        ns.print(`Current targets: ${currentTargets}`);

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

            const serverInfo = [];
            for(const server of availableServers){
                const maxRam = ns.getServerMaxRam(server);
                const usedRam = ns.getServerUsedRam(server);
                const freeRam = maxRam - usedRam;
                serverInfo.push({hostname: server, maxRam: maxRam, usedRam: usedRam, freeRam: freeRam});
                const scriptName = activeTasks[activeTasks.length - 1].task + ".js";
                let threadSize = ns.getScriptRam(scriptName, server);
                let threadsNeeded = Math.floor(freeRam / threadSize);
                // Set expectedTime only if we will actually schedule the task
                if (threadsNeeded > 0 && threadsNeeded != Infinity) {
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
                else
                  ns.print(`server ${server} threadsNeeded = ${threadsNeeded} threadSize = ${threadSize} freeRam = ${freeRam}`);
            }
            ns.print(`Available servers: ${JSON.stringify(serverInfo)}`);

            // Assign the task with the correct number of threads, move to the next loop iteration.
            
        }
        await ns.sleep(1000); // Allow time for the tasks to be scheduled
    }
}

