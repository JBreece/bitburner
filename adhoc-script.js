/** @param {NS} ns */
export async function main(ns) {
  let moneyAvailable = "";
  let minSecLevel = "";
  let secLevel = "";
  let karma = "";
  let myMultipliers = "";
  let allEquips = [];
  const combatEquips = [];
  moneyAvailable = ns.getServerMoneyAvailable('joesguns');
  minSecLevel = ns.getServerMinSecurityLevel('joesguns');
  secLevel = ns.getServerSecurityLevel('joesguns');
  //let myAdhocRequest = moneyAvailable + ' ' + minSecLevel + ' ' + secLevel;  // change this line
  karma = ns.heart.break().toFixed(2);
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
    | minSecLevel = ${minSecLevel}
    | secLevel = ${secLevel}
    | karma = ${karma}
    | myMultipliers = ${myMultipliers}
    | combatEquips = ${combatEquips}`;
  ns.tprint(myAdhocRequest);
  ns.ui.openTail();
}