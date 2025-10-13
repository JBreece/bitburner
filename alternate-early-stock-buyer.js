/** @param {NS} ns **/
export async function main(ns) {
    ns.disableLog("sleep");
    ns.disableLog("getServerMoneyAvailable");
    ns.tail();

    // CONFIG
    const reserve = 1e6;       // Never spend below $1M
    const perStockBudget = 5e7; // Max spend per stock
    const minSharesToBuy = 1;   // Ignore tiny buys

    const minProfitAbsolute = 1e6; // $1M profit before selling
    const minProfitPercent = 0.05; // 5% gain before selling

    const symbols = ns.stock.getSymbols();

    // Build server graph -> map orgName -> hostname
    const visited = new Set();
    const serverList = [];
    function dfs(host) {
        visited.add(host);
        const s = ns.getServer(host);
        if (s.organizationName) serverList.push({ host, org: s.organizationName });
        for (const n of ns.scan(host)) {
            if (!visited.has(n)) dfs(n);
        }
    }
    dfs("home");

    const orgToHostname = {};
    const hostToOrg = {};
    for (const e of serverList) {
        orgToHostname[e.org] = e.host;
        hostToOrg[e.host] = e.org;
    }

    // Map org -> symbol
    const orgToSymbol = {};
    for (const sym of symbols) {
        const org = ns.stock.getOrganization(sym);
        if (org) orgToSymbol[org] = sym;
    }

    // Helper: try to open ports and nuke host
    function tryRoot(host) {
        if (ns.hasRootAccess(host)) return true;

        const portPrograms = [
            { file: "BruteSSH.exe", fn: () => ns.brutessh(host) },
            { file: "FTPCrack.exe", fn: () => ns.ftpcrack(host) },
            { file: "relaySMTP.exe", fn: () => ns.relaysmtp(host) },
            { file: "HTTPWorm.exe", fn: () => ns.httpworm(host) },
            { file: "SQLInject.exe", fn: () => ns.sqlinject(host) },
        ];

        let portsOpened = 0;
        for (const p of portPrograms) {
            if (ns.fileExists(p.file, "home")) {
                try { p.fn(); } catch (e) {}
                portsOpened++;
            }
        }

        const req = ns.getServerNumPortsRequired(host);
        if (portsOpened >= req && req > 0) {
            try { ns.nuke(host); } catch (e) {}
        }

        return ns.hasRootAccess(host);
    }

    // MAIN LOOP
    while (true) {
        const cash = ns.getServerMoneyAvailable("home");
        if (cash <= reserve) {
            ns.print(`Low cash (${ns.nFormat(cash, "$0.00a")}), waiting...`);
            await ns.stock.nextUpdate();
            continue;
        }

        // === BUY LOGIC ===
        for (const org of Object.keys(orgToHostname)) {
            const host = orgToHostname[org];
            if (!host) continue;

            // Skip servers with no money
            const maxMoney = ns.getServerMaxMoney(host);
            if (!Number.isFinite(maxMoney) || maxMoney <= 0) continue;

            // Check hack level
            const reqHack = ns.getServerRequiredHackingLevel(host);
            if (reqHack > ns.getHackingLevel()) continue;

            // Ensure root access
            if (!ns.hasRootAccess(host)) {
                if (!tryRoot(host)) continue;
            }

            const sym = orgToSymbol[org];
            if (!sym) continue;

            const pos = ns.stock.getPosition(sym);
            const ownedShares = pos[0];
            const avgPrice = pos[1];

            // Determine budget
            const availableToSpend = Math.max(0, cash - reserve);
            const budget = Math.min(perStockBudget, availableToSpend);
            if (budget <= 0) continue;

            const price = ns.stock.getPrice(sym);
            if (!price || price <= 0) continue;

            const sharesToBuy = Math.floor(budget / price);
            if (sharesToBuy < minSharesToBuy) continue;

            // Skip if already invested heavily
            if (ownedShares > 0 && avgPrice > 0 && ownedShares * avgPrice >= perStockBudget * 2) continue;

            const actuallyBought = ns.stock.buyStock(sym, sharesToBuy);
            if (actuallyBought > 0) {
                ns.print(`Bought ${actuallyBought} shares of ${sym} (${org}) at $${ns.nFormat(price, "0.00a")}, spending $${ns.nFormat(actuallyBought * price, "0.00a")}`);
            }
        }

        // === SELL LOGIC ===
        let totalProfits = 0;
        for (const sym of symbols) {
            const pos = ns.stock.getPosition(sym);
            const shares = pos[0];
            const avgPrice = pos[1];

            if (shares <= 0) continue;

            const price = ns.stock.getPrice(sym);
            const revenue = shares * price;
            const invested = shares * avgPrice;
            const profit = revenue - invested;
            const profitPct = profit / invested;

            ns.tprint(`[DEBUG] ${sym} profit $${ns.nFormat(profit, "0.00a")} (${(profitPct*100).toFixed(2)}%)`);

            if (profit >= minProfitAbsolute || profitPct >= minProfitPercent) {
                const sold = ns.stock.sellStock(sym, shares);
                if (sold > 0) {
                    totalProfits += profit;
                    ns.print(`Sold ${shares} ${sym} for +$${ns.nFormat(profit, "0.00a")} profit`);
                    ns.tprint(`[STOCK] Sold ${shares} ${sym} for +$${ns.nFormat(profit, "0.00a")} profit | Total Profits: $${ns.nFormat(totalProfits, "0.00a")}`);
                }
            }
        }

        // Wait until next stock market tick
        await ns.stock.nextUpdate();
    }
}
