export async function main(ns: typeof NS) {
	const target = `${ns.args[0]}`

	const serverMaxMoney = ns.getServerMaxMoney(target) * 0.9
	const serverMinSecurity = ns.getServerMinSecurityLevel(target) * 1.1

	while (true) {
		if (ns.getServerSecurityLevel(target) >= serverMinSecurity) await ns.weaken(target)
		else if (ns.getServerMoneyAvailable(target) <= serverMaxMoney) await ns.grow(target)
		else await ns.hack(target)
	}
}
