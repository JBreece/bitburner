/** @param {NS} ns */

export async function main(ns) {
    const allLocations = ns.infiltration.getPossibleLocations();
    const infiltrationData = [];
    const securityThreshold = 2;  // edit this depending on how lazy i'm feeling (note, 0 is min difficulty, 3 is max)
    for(const location of allLocations){
        //ns.tprint(`location is ${location.name} and is type ${typeof(location.name)}`);
        infiltrationData.push(ns.infiltration.getInfiltration(location.name));
    }
    //ns.tprint(`Type of infiltrationData = ${infiltrationData[0]}`);
    let bestName = "";
    let bestLocation = "";
    let rewardRatio = 0;
    for(const myInfiltration of infiltrationData){
        ns.tprint(`${myInfiltration.difficulty}`);
        if(((myInfiltration.reward).tradeRep / myInfiltration.maxClearanceLevel) > rewardRatio && myInfiltration.difficulty < securityThreshold){
            rewardRatio = ((myInfiltration.reward).tradeRep / myInfiltration.maxClearanceLevel);
            bestName = (myInfiltration.location).name;
            bestLocation = (myInfiltration.location).city;
        }
    }
    ns.tprint(`Best location is ${bestName} at ${bestLocation} for a reward ratio of ${rewardRatio}`);
}