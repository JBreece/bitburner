/** @param {NS} ns **/
export async function main(ns) {
    ns.disableLog("sleep");
    ns.disableLog("getServerMoneyAvailable");
    ns.tail();

    // CONFIG
    const reserve = 1e7;       // Never spend below $10M
    const perStockBudget = 1e7; // Max spend per stock
    const minSharesToBuy = 1;   // Ignore tiny buys

    const minProfitAbsolute = 5e5; // $500k profit before selling
    const minProfitPercent = 0.02; // 2% gain before selling
    const dipPercent = 0.05;       // wait until price dips 5% below avg before buying

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

    // Hold map: sym -> holdUntilPrice (price must drop to or below this to clear hold)
    let holds = {}; // e.g. holds["ECP"] = 12345.67

    // MAIN LOOP
    while (true) {
        // === SELL LOGIC ===  // note, this should happen before checking cash for buys otherwise we won't sell if low on cash
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

            // ns.tprint(`[DEBUG] ${sym} profit $${profit} (${(profitPct*100).toFixed(2)}%)`);

            if (profit >= minProfitAbsolute && profitPct >= minProfitPercent) {
                const sold = ns.stock.sellStock(sym, shares);
                if (sold > 0) {
                    totalProfits += profit;
                    ns.print(`Sold ${shares} ${sym} for +$${profit} profit`);
                    ns.tprint(`[STOCK] Sold ${shares} ${sym} for +$${profit} profit | Total Profits: $${totalProfits}`);
                
                    // Set a hold: wait until price dips by dipPercent from this sell price
                    const holdUntilPrice = price * (1 - dipPercent);
                    holds[sym] = holdUntilPrice;
                    ns.print(`Placed hold on ${sym} until price <= ${holdUntilPrice} (sold at ${price})`);
                }
            }
            else {
                ns.print(`Holding ${shares} ${sym}: profit $${profit} (${(profitPct*100).toFixed(2)}%) — waiting for $${minProfitAbsolute} and ${(minProfitPercent*100).toFixed(2)}%`);
            }
        }

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

            // // Skip servers with no money
            // const maxMoney = ns.getServerMaxMoney(host);
            // if (!Number.isFinite(maxMoney) || maxMoney <= 0) continue;

            // // Check hack level
            // const reqHack = ns.getServerRequiredHackingLevel(host);
            // if (reqHack > ns.getHackingLevel()) continue;

            // // Ensure root access
            // if (!ns.hasRootAccess(host)) {
            //     if (!tryRoot(host)) continue;
            // }

            const sym = orgToSymbol[org];
            if (!sym) continue;

            const pos = ns.stock.getPosition(sym);
            const ownedShares = pos[0];
            const avgPrice = pos[1];

            // Cash available to spend this tick
            const availableToSpend = Math.max(0, cash - reserve);
            if (availableToSpend <= 0) continue;

            // Compute portfolio invested total (sum of avgPrice * shares across all symbols)
            const portfolioInvested = symbols.reduce((acc, s) => {
                const p = ns.stock.getPosition(s);
                return acc + (p[0] * p[1]);
            }, 0);

            // Configure per-symbol maximum total investment:
            // - at minimum allow perStockBudget
            // - at maximum allow perStockBudget * 10
            // - otherwise use a percentage of current portfolio (here 50%)
            const capPercent = 0.50; // 50% of portfolio invested value
            const maxPerSymbolByPercent = portfolioInvested * capPercent;
            const maxPerSymbol = Math.max(perStockBudget, Math.min(perStockBudget * 10, maxPerSymbolByPercent || perStockBudget));

            // Don't exceed the per-symbol total cap (but allow multiple buys across ticks until that cap)
            const currentlyInvested = ownedShares * avgPrice;
            const remainingAllowed = Math.max(0, maxPerSymbol - currentlyInvested);
            if (remainingAllowed <= 0) continue;

            // Each single buy is still limited to perStockBudget (so you won't spend > perStockBudget in one buy)
            const budget = Math.min(perStockBudget, availableToSpend, remainingAllowed);
            if (budget <= 0 || budget < perStockBudget) continue;

            const price = ns.stock.getPrice(sym);
            if (!price || price <= 0) continue;

            // If this symbol is on hold due to a recent sell, skip buying until it dips far enough
            if (holds[sym] !== undefined) {
                const holdUntil = holds[sym];
                if (price > holdUntil) {
                    ns.print(`Skipping buy for ${sym} — on hold until price <= ${ns.nFormat(holdUntil, "0.00a")} (current ${ns.nFormat(price, "0.00a")})`);
                    continue;
                } else {
                    // price dipped to or below threshold: clear hold and allow buys again
                    delete holds[sym];
                    ns.print(`Hold cleared for ${sym} — price dipped to ${ns.nFormat(price, "0.00a")}`);
                }
            }

            const sharesToBuy = Math.floor(budget / price);
            if (sharesToBuy < minSharesToBuy) continue;

            const actuallyBought = ns.stock.buyStock(sym, sharesToBuy);
            if (actuallyBought > 0) {
                ns.print(`Bought ${actuallyBought} shares of ${sym} (${org}) at $${ns.nFormat(price, "0.00a")}, spending $${ns.nFormat(actuallyBought * price, "0.00a")}`);
            }
        }

        // Wait until next stock market tick
        await ns.stock.nextUpdate();
    }
}
