export async function main(ns) {
    const target = ns.args[0];
    if (!target) {
        ns.tprint("Please provide a target server name as an argument.");
        return;
    }
    while(true){
        if(ns.hasRootAccess(target)){
            await ns.weaken(target);
        }
        else{
            ns.printf(`No root access for ${target}`);
            return;
        }
    }
}