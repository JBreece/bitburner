/** @param {NS} ns **/
export async function main(ns) {
  ns.disableLog("sleep");
  ns.ui.openTail();
  const WORKER = ns.args[0];  // e.g., "grow.js"
  const target = ns.args[1];  // e.g., "joesguns"
  if (!target) {
    ns.tprint("Usage: run run-grow-on-all.js <targetHost>");
    return;
  }

  const minRamNeeded = 0; // allow small hosts; change if you want

  // DFS crawl for hostnames
  const visited = new Set();
  function dfs(h) {
    visited.add(h);
    for (const n of ns.scan(h)) if (!visited.has(n)) dfs(n);
  }
  dfs("home");

  const execHosts = [];
  for (const h of visited) {
    if (h === "home") continue; // don't touch the home machine
    ns.printf(`Checking host: ${h}`);
    try {
      ns.scp(WORKER, h);
      ns.killall(h);
      if (ns.hasRootAccess(h) && ns.getServerMaxRam(h) >= minRamNeeded) execHosts.push(h);
    } catch (e) {}
  }

  let totalThreads = 0;
  for (const host of execHosts) {
    try {
      const free = ns.getServerMaxRam(host) - ns.getServerUsedRam(host);
      const ramPerThread = ns.getScriptRam(WORKER, host);
      if (!Number.isFinite(ramPerThread) || ramPerThread <= 0) continue;
      const threads = Math.floor(free / ramPerThread);
      if (threads <= 0) {
        ns.print(`${host}: insufficient free RAM for ${WORKER}`);
        continue;
      }

      // Ensure worker exists on host
      await ns.scp(WORKER, host);

      const pid = ns.exec(WORKER, host, threads, target);
      ns.print(`${host}: exec ${WORKER} x${threads} -> ${target} (pid=${pid})`);
      totalThreads += threads;
    } catch (err) {
      ns.print(`${host}: error: ${err}`);
    }
  }

  ns.tprint(`Launched ${WORKER} for ${target} on ${execHosts.length} hosts, total threads: ${totalThreads}`);
}
