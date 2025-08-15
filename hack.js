export async function main(ns) {
    const target = ns.args[0];
    if (!target) {
        ns.tprint("Please provide a target server name as an argument.");
        return;
    }
    while(true){
        await ns.hack(target);
    }
}