/** @param {NS} ns */
export async function main(ns) {
  const myAdhocRequest = ns.getServerMoneyAvailable('joesguns');  // change this line

  /*
  let myVar = 'Rho Construction';  // change this line
  function getServerName(orgName){
    let serverName = orgName.toLowerCase();
    serverName = serverName.replaceAll(" ", "-");
    return serverName;
  }
  myVar = getServerName(myVar);
  const myAdhocRequest = ns.getServerRequiredHackingLevel(myVar);
  */

  ns.print(myAdhocRequest);
  ns.ui.openTail();
}