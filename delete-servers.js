/** @param {NS} ns */
export async function main(ns) {
  var currentServers = ns.getPurchasedServers();
  const minRamToDelete = ns.args[0];

  if(minRamToDelete){
    for(var i = 0; i < currentServers.length; ++i){
      var server = currentServers[i];
      let serverRam = ns.getServerMaxRam(server);
      if(serverRam < minRamToDelete){
        ns.killall(server);
        ns.deleteServer(server);
      }
    }
  } else{ns.tprint(`Invalid amount of args. Need 1 arg for ram size to delete (if server is below that ram threshold)`);}
}