/** @param {NS} ns */
export async function main(ns) {
  const [server = "sigma-cosmetics"] = ns.args  // default to sigma-cosmetics if no server specified

  function runScript(ns, scriptName, server, threadsNeeded, args){
    if (Array.isArray(args) && args.length) {
      let execResult = ns.exec(scriptName, server, threadsNeeded, ...args);
      ns.print(`Started PID ${execResult} for ${scriptName} using ${threadsNeeded} threads on server ${server} with ${args.join(", ")} args`);
    }
    else if(args){
      let execResult = ns.exec(scriptName, server, threadsNeeded, args);
      ns.print(`Started PID ${execResult} for ${scriptName} using ${threadsNeeded} threads on server ${server} with ${args} args`);
    }
    else{
      let execResult = ns.exec(scriptName, server, threadsNeeded);
      ns.print(`Started PID ${execResult} for ${scriptName} using ${threadsNeeded} threads on server ${server}`);
    }
    return;
  }

  while(true){
    let moneyAvailable = ns.getServerMoneyAvailable(server);
    let maxMoney = ns.getServerMaxMoney(server);
    let minSecLevel = ns.getServerMinSecurityLevel(server);
    let secLevel = ns.getServerSecurityLevel(server);
    while(moneyAvailable < maxMoney || secLevel > minSecLevel) {  // until we're at max money & min sec, continue to grow() and weaken()
      moneyAvailable = ns.getServerMoneyAvailable(server);
      maxMoney = ns.getServerMaxMoney(server);
      minSecLevel = ns.getServerMinSecurityLevel(server);
      secLevel = ns.getServerSecurityLevel(server);
      runScript(ns, "stock-manipulate.js", "home", 1, ["grow.js",server]);
      await ns.sleep(30000);
      runScript(ns, "stock-manipulate.js", "home", 1, ["weaken.js",server]);
      await ns.sleep(30000);
    }
    while(moneyAvailable > 1 || secLevel > minSecLevel) {  // until we're at min money & min sec, continue to hack() and weaken()
      moneyAvailable = ns.getServerMoneyAvailable(server);
      maxMoney = ns.getServerMaxMoney(server);
      minSecLevel = ns.getServerMinSecurityLevel(server);
      secLevel = ns.getServerSecurityLevel(server);
      runScript(ns, "stock-manipulate.js", "home", 1, ["hack.js",server]);
      await ns.sleep(30000);
      runScript(ns, "stock-manipulate.js", "home", 1, ["weaken.js",server]);
      await ns.sleep(30000);
    }

  }
}