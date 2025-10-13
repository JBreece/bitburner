/** @param {NS} ns **/
export async function main(ns) {
    ns.ui.openTail();

    // CONFIG
    const loopSleep = 5000;       // ms between scheduler ticks
    const minMoney = 5;           // skip servers with ≤ this max money
    const minExecRam = 4;         // only use exec hosts with this much RAM
    const weakenScript = "weaken.js";
    const growScript   = "grow.js";
    const hackScript   = "hack.js";

    function safeHasRootAccess(ns, host) {
        try {
            if (!host || typeof host !== "string") return false;
            return ns.hasRootAccess(host);
        } catch (err) {
            ns.tprint(`safeHasRootAccess failed on host=${host}: ${err}`);
            return false;
        }
    }


    /** Build mapping of org <-> hostname <-> stock symbol */
    function buildMaps(ns) {
        const symbols = ns.stock.getSymbols();

        // DFS crawl to map servers ↔ orgs
        const visited = new Set();
        const serverList = [];
        function dfs(host) {
            visited.add(host);
            const s = ns.getServer(host);
            if (s.organizationName) {
                serverList.push({ host, org: s.organizationName });
            }
            for (const n of ns.scan(host)) {
                if (!visited.has(n)) dfs(n);
            }
        }
        dfs("home");

        const orgToHost = {};
        const hostToOrg = {};
        for (const e of serverList) {
            orgToHost[e.org] = e.host;
            hostToOrg[e.host] = e.org;
        }

        // Org → symbol map
        const orgToSymbol = {};
        for (const sym of symbols) {
            const org = ns.stock.getOrganization(sym);
            if (org) orgToSymbol[org] = sym;
        }

        return { orgToHost, hostToOrg, orgToSymbol };
    }


    /** Get rooted servers that can run scripts */
/** safe helper to check hasRootAccess */
function safeHasRootAccess(ns, host) {
  try {
    if (!host || typeof host !== "string") return false;
    return ns.hasRootAccess(host);
  } catch (e) {
    ns.tprint(`safeHasRootAccess error for ${host}: ${e}`);
    return false;
  }
}

/** Debuggable getExecHosts */
function getExecHosts(minRam = 4) {
  const hosts = new Set(["home", ...ns.getPurchasedServers()]);
  const visited = new Set();
  const stack = ["home"];

  // Crawl entire network (hostnames only)
  while (stack.length) {
    const h = stack.pop();
    if (visited.has(h)) continue;
    visited.add(h);
    for (const n of ns.scan(h)) {
      if (!visited.has(n)) stack.push(n);
    }
  }

  // DEBUG: show what we discovered
  ns.tprint(`Crawl discovered ${visited.size} servers`);
  ns.tprint(`Purchased servers: ${JSON.stringify(ns.getPurchasedServers())}`);
  // Show each visited server's root + RAM info
  for (const h of visited) {
    let maxRam = "ERR";
    let hasRoot = "ERR";
    try { maxRam = ns.getServerMaxRam(h); } catch (e) { maxRam = `ERR(${e})`; }
    try { hasRoot = safeHasRootAccess(ns, h); } catch (e) { hasRoot = `ERR(${e})`; }
    ns.tprint(`Visited: ${h} -> hasRoot=${hasRoot}, maxRam=${maxRam}`);
    // Add to host set if it meets criteria
    if (hasRoot && Number.isFinite(maxRam) && maxRam >= minRam) hosts.add(h);
  }

  const out = Array.from(hosts);
  ns.tprint(`Exec hosts returning (${out.length}): ${JSON.stringify(out)}`);
  return out;
}


    /** Decide hack vs grow based on stock ownership */
function decideTask(ns, maps, target) {
    if (!safeHasRootAccess(ns, target)) {
        return null;
    }
    const maxMoney = ns.getServerMaxMoney(target);
    if (maxMoney <= minMoney) {
        return null;
    }

    const org = maps.hostToOrg[target];
    if (!org) {
        return null;
    }
    const sym = maps.orgToSymbol[org];
    if (!sym) {
        return null;
    }

    const owns = ns.stock.getPosition(sym)[0] > 0;
    return owns ? "grow" : "hack";
}


    /** Kill wrong-task scripts if stock strategy flips */
    function reconcileWorkers(ns, maps, execHosts) {
        for (const host of execHosts) {
            for (const proc of ns.ps(host)) {
                ns.tprint(`Running: ${proc.filename} on ${host} with args: ${proc.args}`);
                if (![hackScript, growScript, weakenScript].includes(proc.filename)) continue;
                const target = proc.args[0];
                if (!target) continue;

                const task = decideTask(maps, target);
                if (!task) continue;

                if (task === "grow" && proc.filename === hackScript) {
                    ns.tprint(`Trying to kill ${proc.filename} on ${host} for target ${target}`);
                    const success = ns.kill(proc.filename, host, ...proc.args);
                    ns.tprint(`Kill returned: ${success}`);
                }
                if (task === "hack" && proc.filename === growScript) {
                    ns.tprint(`Trying to kill ${proc.filename} on ${host} for target ${target}`);
                    const success = ns.kill(proc.filename, host, ...proc.args);
                    ns.tprint(`Kill returned: ${success}`);
                }
            }
        }
    }

    /** Simple spread: run task on all exec hosts */
    function launchWork(ns, execHosts, target, task) {
        const script = (task === "hack") ? hackScript :
                       (task === "grow") ? growScript :
                       weakenScript;

        for (const host of execHosts) {
            const free = ns.getServerMaxRam(host) - ns.getServerUsedRam(host);
            const perThread = ns.getScriptRam(script, host);
            const threads = Math.floor(free / perThread);
            if (threads > 0) {
                ns.exec(script, host, threads, target);
            }
        }
    }

    // === MAIN LOOP ===
    while (true) {
        const maps = buildMaps(ns);
        const execHosts = getExecHosts(ns);
        reconcileWorkers(ns, maps, execHosts);

        // Try each stock-owned server
        for (const org in maps.orgToHost) {
            const target = maps.orgToHost[org];
            const task = decideTask(ns, maps, target);
            if (!task) continue;
            launchWork(ns, execHosts, target, task);
        }

        await ns.sleep(loopSleep);
    }
}
