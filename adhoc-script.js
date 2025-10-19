/** @param {NS} ns */
export async function main(ns) {
  const [server = "joesguns"] = ns.args;
  let moneyAvailable = "";
  let maxMoney = "";
  let minSecLevel = "";
  let secLevel = "";
  let karma = "";
  let myMultipliers = "";
  let allEquips = [];
  let corpInfo = "";
  const combatEquips = [];
  moneyAvailable = ns.getServerMoneyAvailable(server);
  maxMoney = ns.getServerMaxMoney(server);
  minSecLevel = ns.getServerMinSecurityLevel(server);
  secLevel = ns.getServerSecurityLevel(server);
  //let myAdhocRequest = moneyAvailable + ' ' + minSecLevel + ' ' + secLevel;  // change this line
  karma = ns.heart.break().toFixed(2);
  //corpInfo = JSON.stringify(ns.corporation.getMaterial("agri","Chongqing","Plants"));
  let bnMultipliers = JSON.stringify(ns.getBitNodeMultipliers());
  //allEquips = ns.gang.getEquipmentNames();
  //for(const equip of allEquips){
  //  combatEquips.push(ns.gang.getEquipmentType(equip));
  //}
  //myMultipliers = bnMultipliers.replaceAll(",","\n|");

  //let myAdhocRequest = ns.singularity.getDarkwebPrograms();
  //ns.tprint(`${ns.getScriptRam("early-hack-template.js", "home")}`);
  //ns.tprint(`${ns.getScriptRam("grow-stock.js", "home")}`);
  //ns.tprint(`${ns.getServerMaxRam("pserv-4")}`);

  /*
  let now = new Date();
  let hours = now.getHours();
  let minutes = now.getMinutes();
  let seconds = now.getSeconds();
  ns.tprint(`${hours} hours | ${minutes} min | ${seconds} sec`);
  */

  // // Stock inspection for adhoc printout — tweak myStock as needed
  // let myStock = "JGN"; // change this to inspect another symbol
  // let myStockShares = 0;
  // let myStockAvgPrice = "";
  // let myStockCurrentPrice = "";
  // let myStockProfit = "";

  // if (myStock) {
  //   try {
  //     const pos = ns.stock.getPosition(myStock); // [shares, avgPrice, ???]
  //     myStockShares = pos[0] || 0;
  //     const avg = pos[1] || 0;
  //     myStockCurrentPrice = ns.stock.getPrice(myStock) || 0;

  //     if (myStockShares > 0) {
  //       myStockAvgPrice = ns.nFormat(avg, "$0.00a");
  //       const profit = (myStockCurrentPrice - avg) * myStockShares;
  //       myStockProfit = ns.nFormat(profit, "$0.00a");
  //     }
  //   } catch (e) {
  //     ns.print(`Error reading stock ${myStock}: ${e}`);
  //   }
  // }

  /*
  let myVar = 'Rho letruction';  // change this line
  function getServerName(orgName){
    let serverName = orgName.toLowerCase();
    serverName = serverName.replaceAll(" ", "-");
    return serverName;
  }
  myVar = getServerName(myVar);
  let myAdhocRequest = ns.getServerRequiredHackingLevel(myVar);
  */

  let myAdhocRequest = `
    | moneyAvailable = ${moneyAvailable}
    | maxMoney = ${maxMoney}
    | minSecLevel = ${minSecLevel}
    | secLevel = ${secLevel}
    | karma = ${karma}
    | myMultipliers = ${myMultipliers}
    | combatEquips = ${combatEquips}
    | corpInfo = ${corpInfo};`;
  ns.tprint(myAdhocRequest);
  ns.ui.openTail();
}