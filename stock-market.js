/** @param {NS} ns */

export async function main(ns) {
  ns.ui.openTail();
  const moneyImWillingToLose = 1000000;
  const moneyImNotWillingToGoBelow = 1000000;
  const moneyImPaperHandsingFor = 1000000;
  const desiredProfitThreshold = 2000000;
  const tradableStocks = ns.stock.getSymbols();
  const serverDict = [];
  const visited = new Set();
  const activeTasks = [];
  let totalProfits = 0;
  let playerMoney = ns.getPlayer().money;
  let playerHackingLevel = ns.getHackingLevel();
  function dfs(server, depth = 0) {
    visited.add(server);
    const myServer = ns.getServer(server);
    const myServerAndOrg = {hostname: server, orgName: myServer.organizationName}
    serverDict.push(myServerAndOrg);

    const neighbors = ns.scan(server);
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        dfs(neighbor, depth + 1);
      }
    }
  }
  dfs('home');
  const orgToHostname = {};
  const hostToOrgname = {};
  for (const entry of serverDict) {
    if (entry.orgName) {
      orgToHostname[entry.orgName] = entry.hostname;
    }
    if (entry.orgName) {
      hostToOrgname[entry.hostname] = entry.orgName;
    }
  }
  const orgToSymbol = {};
  for (const sym of tradableStocks) {
      const orgName = ns.stock.getOrganization(sym); // maps symbol to company
      orgToSymbol[orgName] = sym;
  }

  //ns.tprint(JSON.stringify(serverDict, null, 2));

  while(true) {
    playerMoney = ns.getPlayer().money;
    playerHackingLevel = ns.getHackingLevel();
    if(playerMoney > moneyImNotWillingToGoBelow) {  // buy stocks only if I have a certain amount of money
      playerMoney = ns.getPlayer().money;
      playerHackingLevel = ns.getHackingLevel();
      // calculate total portfolio
      let totalInvested = 0;
      for(let i = 0; i < tradableStocks.length; i++){
        let portfolioStock = tradableStocks[i];
        let myPosition = ns.stock.getPosition(portfolioStock);
        let mySharesOwned = myPosition[0];
        let myAveragePrice = myPosition[1];
        //let mySharesShorted = myPosition[2];
        //let myAverageShortPrice = myPosition[3];
        totalInvested = totalInvested + (mySharesOwned * myAveragePrice);
      }

      if(ns.stock.has4SDataTIXAPI() == false){  // early game strategy until I have TIX API access
        ns.tprint("no TIX API access yet!");
        for(let i = 0; i < tradableStocks.length; i++){
          playerMoney = ns.getPlayer().money;
          playerHackingLevel = ns.getHackingLevel();
          let buyableStock = tradableStocks[i];
          let stockPrice = ns.stock.getPrice(buyableStock);
          let myPosition = ns.stock.getPosition(buyableStock);
          let mySharesOwned = myPosition[0];
          let myAveragePrice = myPosition[1];

          const isValid =
            Number.isFinite(mySharesOwned) &&
            Number.isFinite(myAveragePrice) &&
            Number.isFinite(totalInvested) &&
            totalInvested > 0;

          const myPortfolioPercentage = isValid
            ? (mySharesOwned * myAveragePrice / totalInvested) * 100
            : 0;

          const orgName = ns.stock.getOrganization(buyableStock);
          const serverName = orgToHostname[orgName];

          // attempt at a try catch for hackable stock
          let stockHackLevel;
          try{
            stockHackLevel = ns.getServerRequiredHackingLevel(serverName);
          } catch (error) {
            //ns.printf(`not a hackable stock! ${error}`);
            continue;
          }

          if(myPortfolioPercentage < 10 && stockHackLevel < playerHackingLevel && playerMoney > moneyImNotWillingToGoBelow){
            let myNumSharesToPurchase = moneyImWillingToLose / stockPrice;
            let myPurchase = ns.stock.buyStock(buyableStock, myNumSharesToPurchase);
            ns.printf(`Purchased Shares! ${myNumSharesToPurchase} of ${buyableStock} at $${myPurchase}`);
            ns.tprint(`Purchased Shares! ${myNumSharesToPurchase} of ${buyableStock} at $${myPurchase}`);
          } else {
            /*  re-enable this if need to debug
            ns.printf(`no shares purchased!`);
            ns.printf(`possible reasons: money $${playerMoney} | portfolio ${myPortfolioPercentage} | hackLevel ${stockHackLevel} | forecast ${myForecast}`);
            */
          }
        }
        // manage servers and hack/grow targets
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
        const acceptableSecurityLevel = 25; // TODO: make this dynamic
        function getTarget(server, depth = 0){
            targeted.add(server);
            if(ns.getServerMinSecurityLevel(server) < acceptableSecurityLevel){
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
                    && !availableServers.includes(neighbor)){ // not already in the list
                    //&& !neighbor.includes("pserv-")){ // not a purchased server
                        ns.scp("weaken.js", neighbor);
                        ns.scp("grow.js", neighbor);
                        ns.scp("hack.js", neighbor);
                    }
                }
            }
        }
        findServers('home');
        // Now, for each target, determine the task to run and how many threads to use
        for(const target of currentTargets){
            // Check if the target is already being worked on
            const foundTask = activeTasks.find(name => name.targetName === target);
            const currentActiveTask = foundTask ? foundTask.task : null;
            if(currentActiveTask === "grow" || currentActiveTask === "weaken" || currentActiveTask === "hack"){
                ns.print(`Skipping ${target} as it already has an active task: ${currentActiveTask}`);
                continue; // Skip if there's already an active task
            }
            // If I own it, grow it.  If I don't own it, hack it.  If it's too secure, weaken it.
            const orgName = hostToOrgname[target];
            const symbolName = orgToSymbol[orgName];
            let myPosition = [0,0];
            if(symbolName != undefined){
              myPosition = ns.stock.getPosition(symbolName);
            }
            else{continue;} // skip non-stock orgs
            let mySharesOwned = myPosition[0];
            let myAveragePrice = myPosition[1];
            const isValid =
              Number.isFinite(mySharesOwned) &&
              Number.isFinite(myAveragePrice) &&
              Number.isFinite(totalInvested) &&
              totalInvested > 0;
            const myPortfolioPercentage = isValid
              ? (mySharesOwned * myAveragePrice / totalInvested) * 100
              : 0;  // percentage of my portfolio in this stock's org
            if(ns.getServerSecurityLevel(target) > ns.getServerMinSecurityLevel(target)){
                activeTasks.push({targetName: target, task: "weaken", expectedTime: 1});
            }
            else if(myPortfolioPercentage > 0){
                activeTasks.push({targetName: target, task: "grow", expectedTime: 1});
            }
            else if(myPortfolioPercentage < 1 && ns.getServerSecurityLevel(target) <= acceptableSecurityLevel){
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
                }
                activeTasks[activeTasks.length - 1].threadsNeeded = threadsNeeded;
                ns.print(`Calculated ${threadsNeeded} threads needed for ${activeTasks[activeTasks.length - 1]}`);
            }
            if(threadsNeeded <= 0){threadsNeeded = 1;} // Ensure at least 1 thread is used, even if no threads are needed
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
                      continue; // Move to the next target after scheduling
                }
                //else
                  //ns.print(`server ${server} threadsNeeded = ${threadsNeeded} threadSize = ${threadSize} freeRam = ${freeRam}`);
            }
            //ns.print(`Available servers: ${JSON.stringify(serverInfo)}`);     
        }

        // sell stocks
        for(let i = 0; i < tradableStocks.length; i++){
          let sellableStock = tradableStocks[i];
          let myPosition = ns.stock.getPosition(sellableStock);
          let mySharesOwned = myPosition[0];
          let myAveragePrice = myPosition[1];
          let costBasis = mySharesOwned * myAveragePrice;
          const mySaleGain = ns.stock.getSaleGain(sellableStock, mySharesOwned, "Long");
          if(mySharesOwned > 0){
            let totalGain = ns.stock.getSaleGain(sellableStock, mySharesOwned, "Long");
            let potentialProfit = totalGain - costBasis;
            if(potentialProfit > moneyImPaperHandsingFor && mySaleGain > desiredProfitThreshold){
              let mySale = ns.stock.sellStock(sellableStock, mySharesOwned);
              totalProfits = totalProfits + potentialProfit;
              ns.printf(`Purchased Shares! ${mySharesOwned} of ${sellableStock} for $${potentialProfit}!`);
              ns.tprint(`Purchased Shares! ${mySharesOwned} of ${sellableStock} for $${potentialProfit}!`);
              ns.printf(`Total Profits = $${totalProfits}`);
              ns.tprint(`Total Profits = $${totalProfits}`);
            }
          }
        }
      }
      else{  // late game strategy once I have TIX API access
        // buy stocks
        for(let i = 0; i < tradableStocks.length; i++){
          let buyableStock = tradableStocks[i];
          let stockPrice = ns.stock.getPrice(buyableStock);
          let myPosition = ns.stock.getPosition(buyableStock);
          let mySharesOwned = myPosition[0];
          let myAveragePrice = myPosition[1];

          const isValid =
            Number.isFinite(mySharesOwned) &&
            Number.isFinite(myAveragePrice) &&
            Number.isFinite(totalInvested) &&
            totalInvested > 0;

          const myPortfolioPercentage = isValid
            ? (mySharesOwned * myAveragePrice / totalInvested) * 100
            : 0;

          let myForecast = ns.stock.getForecast(buyableStock) * 100;
          const orgName = ns.stock.getOrganization(buyableStock);
          const serverName = orgToHostname[orgName];

          // attempt at a try catch for hackable stock
          let stockHackLevel;
          try{
            stockHackLevel = ns.getServerRequiredHackingLevel(serverName);
          } catch (error) {
            //ns.printf(`not a hackable stock! ${error}`);
            continue;
          }
          playerMoney = ns.getPlayer().money;
          playerHackingLevel = ns.getHackingLevel();
          if(myPortfolioPercentage < 10 && stockHackLevel < playerHackingLevel && playerMoney > moneyImNotWillingToGoBelow){
            let myNumSharesToPurchase = moneyImWillingToLose / stockPrice;
            if(myForecast > 55){
              let myPurchase = ns.stock.buyStock(buyableStock, myNumSharesToPurchase);
              ns.printf(`Purchased Shares! ${myNumSharesToPurchase} of ${buyableStock} at $${myPurchase}`);
              ns.tprint(`Purchased Shares! ${myNumSharesToPurchase} of ${buyableStock} at $${myPurchase}`);
            }
          }
        }

        // sell stocks
        for(let i = 0; i < tradableStocks.length; i++){
          let sellableStock = tradableStocks[i];
          let myPosition = ns.stock.getPosition(sellableStock);
          let mySharesOwned = myPosition[0];
          let myAveragePrice = myPosition[1];
          let costBasis = mySharesOwned * myAveragePrice;
          if(mySharesOwned > 0){
            let totalGain = ns.stock.getSaleGain(sellableStock, mySharesOwned, "Long");
            let potentialProfit = totalGain - costBasis;
            let myForecast = ns.stock.getForecast(sellableStock) * 100;
            if(potentialProfit > moneyImPaperHandsingFor && myForecast < 48){
              let mySale = ns.stock.sellStock(sellableStock, mySharesOwned);
              totalProfits = totalProfits + potentialProfit;
              ns.printf(`Purchased Shares! ${mySharesOwned} of ${sellableStock} for $${potentialProfit}!`);
              ns.tprint(`Purchased Shares! ${mySharesOwned} of ${sellableStock} for $${potentialProfit}!`);
              ns.printf(`Total Profits = $${totalProfits}`);
              ns.tprint(`Total Profits = $${totalProfits}`);
            } else{
              /*  re-enable this if need to debug
              ns.printf(`no shares sold!`);
              ns.printf(`possible reasons: profit $${potentialProfit} | forecast ${myForecast}`);
              */
            }

          }
        }

        // test to make sure this function is working
        //let JGN_price = ns.stock.getPrice('JGN');
        //ns.printf(`JGN_price = $${JGN_price}`);

      }  // end of 'if TIX API access'
    }
    playerMoney = ns.getPlayer().money;
    playerHackingLevel = ns.getHackingLevel();
    await ns.stock.nextUpdate(); // sleep until next price update
  }
}