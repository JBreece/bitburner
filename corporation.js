/** @param {NS} ns */
export async function main(ns) {
    if(ns.corporation.hasCorporation()){
        while(true){

            await ns.sleep(10000);
        }
    }
    else return;  // TODO: make this a createCorporation() call with canCreateCorporation() check
}