export async function main(ns) {
    // const symbols = ns.stock.getSymbols();

    // // Build server graph -> map orgName -> hostname
    // const visited = new Set();
    // const serverList = [];
    // function dfs(host) {
    //     visited.add(host);
    //     const s = ns.getServer(host);
    //     if (s.organizationName) serverList.push({ host, org: s.organizationName });
    //     for (const n of ns.scan(host)) {
    //         if (!visited.has(n)) dfs(n);
    //     }
    // }
    // dfs("home");

    // const orgToHostname = {};
    // const hostToOrg = {};
    // for (const e of serverList) {
    //     orgToHostname[e.org] = e.host;
    //     hostToOrg[e.host] = e.org;
    // }

    // // Map org -> symbol
    // const orgToSymbol = {};
    // for (const sym of symbols) {
    //     const org = ns.stock.getOrganization(sym);
    //     if (org) orgToSymbol[org] = sym;
    // }

    // let myAdhocRequest = `
    // | moneyAvailable = ${moneyAvailable}
    // | minSecLevel = ${minSecLevel}
    // | secLevel = ${secLevel}
    // | karma = ${karma}
    // | myMultipliers = ${myMultipliers}
    // | combatEquips = ${combatEquips}
    // | corpInfo = ${corpInfo};`;
    // ns.tprint(myAdhocRequest);
    // ns.ui.openTail();


  ns.disableLog("sleep");
  ns.tail();

  // Crawl network and collect server -> org info
  const visited = new Set();
  const serverList = [];
  function dfs(host) {
    visited.add(host);
    const s = ns.getServer(host);
    if (s.organizationName) serverList.push({ host, org: s.organizationName });
    for (const n of ns.scan(host)) if (!visited.has(n)) dfs(n);
  }
  dfs("home");

  // Build maps
  const orgToHostname = {};
  const hostToOrg = {};
  for (const e of serverList) {
    orgToHostname[e.org] = e.host;
    hostToOrg[e.host] = e.org;
  }

  // Build org -> symbol map
  const symbols = ns.stock.getSymbols();
  const orgToSymbol = {};
  for (const sym of symbols) {
    try {
      const org = ns.stock.getOrganization(sym);
      if (org) orgToSymbol[org] = sym;
    } catch (e) {}
  }

  // Build rows: include all discovered hosts + any orgs that mapped to hosts
  const rows = [];
  const seenHosts = new Set();

  // First add servers discovered by DFS (keeps order meaningful)
  for (const { host } of serverList) {
    seenHosts.add(host);
    const org = hostToOrg[host] || "";
    const sym = org && orgToSymbol[org] ? orgToSymbol[org] : "";
    let shares = "";
    let price = "";
    if (sym) {
      const pos = ns.stock.getPosition(sym);
      shares = pos[0] || 0;
      price = ns.stock.getPrice(sym) || 0;
    }
    rows.push({ host, org, sym, shares, price });
  }

  // Also include any org->symbol entries that weren't discovered as servers (edge cases)
  for (const org of Object.keys(orgToSymbol)) {
    const host = orgToHostname[org];
    if (!host || seenHosts.has(host)) continue;
    seenHosts.add(host);
    const sym = orgToSymbol[org];
    const pos = ns.stock.getPosition(sym);
    const shares = pos[0] || 0;
    const price = ns.stock.getPrice(sym) || 0;
    rows.push({ host, org, sym, shares, price });
  }

  // If nothing found, print a helpful message
  if (rows.length === 0) {
    ns.tprint("No server <-> organization mappings found on network. Make sure you have servers with organizationName set.");
    return;
  }

  // Calculate column widths
  const hdr = ["HOST", "ORG", "SYMBOL", "SHARES", "PRICE"];
  const cols = {
    host: Math.max(...rows.map(r => r.host.length), hdr[0].length),
    org: Math.max(...rows.map(r => (r.org || "").length), hdr[1].length),
    sym: Math.max(...rows.map(r => (r.sym || "").length), hdr[2].length),
    shares: Math.max(...rows.map(r => String(r.shares).length), hdr[3].length),
    price: Math.max(...rows.map(r => ns.nFormat(r.price || 0, "$0.00a").length), hdr[4].length)
  };

  // Helper pad
  const pad = (s, len) => String(s).padEnd(len, " ");

  // Print header and rows
  ns.tprint(`${pad(hdr[0], cols.host)}  ${pad(hdr[1], cols.org)}  ${pad(hdr[2], cols.sym)}  ${pad(hdr[3], cols.shares)}  ${pad(hdr[4], cols.price)}`);
  ns.tprint(`${"-".repeat(cols.host)}  ${"-".repeat(cols.org)}  ${"-".repeat(cols.sym)}  ${"-".repeat(cols.shares)}  ${"-".repeat(cols.price)}`);

  for (const r of rows) {
    const priceStr = r.sym ? ns.nFormat(r.price || 0, "$0.00a") : "";
    ns.tprint(`${pad(r.host, cols.host)}  ${pad(r.org || "", cols.org)}  ${pad(r.sym || "", cols.sym)}  ${pad(r.shares, cols.shares)}  ${pad(priceStr, cols.price)}`);
  }
}
