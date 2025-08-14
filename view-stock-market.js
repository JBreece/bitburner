/** @param {NS} ns */
export async function main(ns) {
  const tradableStocks = ns.stock.getSymbols();
  for(let i = 0; i < tradableStocks.length; i++){
    let myForecast = ns.stock.getForecast(tradableStocks[i]) * 100;
    ns.printf(`Forecast of ${tradableStocks[i]} = ${myForecast}`);
    // price
    //const price = Math.floor(ns.stock.getPrice(tradableStocks[i])).toLocaleString('en-US');
    //ns.printf(`Price of ${tradableStocks[i]} = $${price}`);
  }
  ns.ui.openTail();
}