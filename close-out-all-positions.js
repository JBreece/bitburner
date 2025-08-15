export async function main(ns) {
    const tradableStocks = ns.stock.getSymbols();
    for(let i = 0; i < tradableStocks.length; i++){
        let sellableStock = tradableStocks[i];
        let myPosition = ns.stock.getPosition(sellableStock);
        let mySharesOwned = myPosition[0];
        if(mySharesOwned > 0){
            let mySale = ns.stock.sellStock(sellableStock, mySharesOwned);
            ns.printf(`Sold Shares! ${mySharesOwned} of ${sellableStock} for $${potentialProfit}!`);
            ns.write("profits.txt", potentialProfit + "\n", "a");
        }
    }

    // Read and sum profits from profits.txt
    let totalProfits = 0;
    if (ns.fileExists("profits.txt")) {
        let profitLines = ns.read("profits.txt").split("\n");
        for (let line of profitLines) {
            if (line.trim() !== "") {
                totalProfits += parseFloat(line);
            }
        }
    }
    ns.tprint(`Total Profits: $${totalProfits}`);
    ns.rm("profits.txt"); // Clean up the file after reading
}