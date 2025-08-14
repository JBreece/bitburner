/** @param {NS} ns */
export async function main(ns) {
  var currentServers = ns.getPurchasedServers();

  for(var i = 0; i < currentServers.length; ++i){
    var server = currentServers[i];
    let serverRam = ns.getServerMaxRam(server);
    if(serverRam < 500){
      ns.killall(server);
      ns.deleteServer(server);
    }
  }
}