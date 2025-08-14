/** @param {NS} ns */
export async function main(ns) {
  const visited = new Set();

  function dfs(server, depth = 0) {
    visited.add(server);
    const indent = '  '.repeat(depth);
    const maxMoney = ns.getServerMaxMoney(server);
    const hackLevel = ns.getServerRequiredHackingLevel(server);
    //let options = [];  //future state, should have array of all options i want to display on the server
    ns.tprint(`${indent}- ${server} | $${maxMoney.toLocaleString()} | ${hackLevel}`);
    // see below for added stuff to run the 'hack' script

    // this clears all my purchased servers and re-runs the code.  Should be unnecessary now but can re-enable if required.
    /*
    if(server.includes('pserv-')){
      ns.scp("early-hack-template.js", server);
      ns.killall(server);
      ns.exec("early-hack-template.js", server, 3);
    }
    */
    
    const neighbors = ns.scan(server);
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        dfs(neighbor, depth + 1);
      }
    }
  }

  dfs('home');
}
