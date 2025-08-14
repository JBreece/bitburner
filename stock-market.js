/** @param {NS} ns */

export async function main(ns) {
  const moneyImWillingToLose = 1000000;
  const moneyImNotWillingToGoBelow = 1000000000;
  const moneyImPaperHandsingFor = 1000000;
  const tradableStocks = ns.stock.getSymbols();
  const serverDict = [];
  const visited = new Set();
  const totalProfits = 0;
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
  for (const entry of serverDict) {
    if (entry.orgName) {
      orgToHostname[entry.orgName] = entry.hostname;
    }
  }

  //ns.tprint(JSON.stringify(serverDict, null, 2));

  while(true) {
    if(playerMoney > moneyImNotWillingToGoBelow) {
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
        if(myPortfolioPercentage < 10 && stockHackLevel < playerHackingLevel && playerMoney > moneyImNotWillingToGoBelow){
          let myNumSharesToPurchase = moneyImWillingToLose / stockPrice;
          if(myForecast > 55){
            let myPurchase = ns.stock.buyStock(buyableStock, myNumSharesToPurchase);
            ns.printf(`Purchased Shares! ${myNumSharesToPurchase} of ${buyableStock} at $${myPurchase}`);
            ns.tprint(`Purchased Shares! ${myNumSharesToPurchase} of ${buyableStock} at $${myPurchase}`);
          } else{
            /*  re-enable this if need to debug
            ns.printf(`no shares purchased!`);
            ns.printf(`possible reasons: money $${playerMoney} | portfolio ${myPortfolioPercentage} | hackLevel ${stockHackLevel} | forecast ${myForecast}`);
            */
          }
        } else {
          /*  re-enable this if need to debug
          ns.printf(`no shares purchased!`);
          ns.printf(`possible reasons: money $${playerMoney} | portfolio ${myPortfolioPercentage} | hackLevel ${stockHackLevel} | forecast ${myForecast}`);
          */
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
      ns.ui.openTail();
    }

    await ns.stock.nextUpdate(); // sleep until next price update
  }
}