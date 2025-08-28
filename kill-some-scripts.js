/** @param {NS} ns */

export async function main(ns) {
    // If no PIDs are provided, log an error and exit.
    if (ns.args.length != 2) {
        ns.tprint(`ERROR: Incorrect args provided. ${ns.args.length} Usage: run kill-some-scripts.js <x> <y>`);
        return;
    }

    const x = ns.args[0];
    const y = ns.args[1];

    for(let pid = x; x < y; pid++) {
        if (typeof x === 'number' && typeof y === 'number' && typeof pid === 'number') {
            const result = ns.kill(pid);
            if (result) {
            ns.tprint(`Successfully killed script with PID: ${pid}`);
            } else {
            ns.tprint(`Failed to kill script with PID: ${pid}. It may not exist.`);
            }
        } else {
            ns.tprint(`Skipping invalid PID range: ${pid}`);
        }
    }
}