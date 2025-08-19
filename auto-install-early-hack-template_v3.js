/** @param {NS} ns */
export async function main(ns) {

  const visited = new Set();
  let scriptRam = ns.getScriptRam("early-hack-template.js", "home");

  function dfs(server, depth = 0) {
    visited.add(server);
    const indent = '  '.repeat(depth);
    const maxMoney = ns.getServerMaxMoney(server);
    const hackLevel = ns.getServerRequiredHackingLevel(server);
    const serverRam = ns.getServerMaxRam(server);
    let threadCount = Math.floor(serverRam / scriptRam);
    const requiredPortNum = ns.getServerNumPortsRequired(server);
    //let options = [];  //future state, should have array of all options i want to display on the server
    ns.tprint(`${indent}- ${server} | $${maxMoney.toLocaleString()} | hackLevel = ${hackLevel} | threadCount = ${threadCount}`);

    ns.scp("early-hack-template.js", server);

    if(requiredPortNum < 1)
      ns.nuke(server);
    else if(requiredPortNum > 0 && ns.fileExists("BruteSSH.exe", "home"))
      ns.brutessh(server);
    if(requiredPortNum > 1 && ns.fileExists("FTPCrack.exe", "home"))
      ns.ftpcrack(server);
    if(requiredPortNum > 2 && ns.fileExists("relaySMTP.exe", "home"))
      ns.relaysmtp(server);
    if(requiredPortNum > 3 && ns.fileExists("HTTPWorm.exe", "home"))
      ns.httpworm(server);
    if(requiredPortNum > 4 && ns.fileExists("SQLInject.exe", "home"))
      ns.sqlinject(server);
    try{
      ns.nuke(server);
    } catch (error) {
      ns.tprint(`Error occurred while attempting to nuke: ${error}`);
    }

    //ns.tprint(`serverRam ${serverRam} | scriptRam ${scriptRam} | threadCount ${threadCount}`);
    if(serverRam > 0) {
      ns.killall(server);
      if(server.includes('pserv-')){
        ns.scp("grow-stock.js", server);
        let servNum = parseInt(server.substring(6, 7));
        if(servNum % 2 === 1){
          scriptRam = ns.getScriptRam("grow-stock.js", server);
          threadCount = Math.floor(serverRam / scriptRam);
          ns.exec("grow-stock.js", server, threadCount);
        }
        else{
        scriptRam = ns.getScriptRam("early-hack-template.js", server);
        threadCount = Math.floor(serverRam / scriptRam);
        ns.exec("early-hack-template.js", server, threadCount);
        }
      }
      else{
        scriptRam = ns.getScriptRam("early-hack-template.js", server);
        threadCount = Math.floor(serverRam / scriptRam);
        ns.exec("early-hack-template.js", server, threadCount);
      }
    }

    const neighbors = ns.scan(server);
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        dfs(neighbor, depth + 1);
      }
    }
  }

  dfs('home');

  ns.ui.openTail();
}