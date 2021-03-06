define([
	'throttler_exec',
	'util'
], function(throttler_exec, util) {

	var IPTABLES_BLOCK_TRAFFIC_CMD 		= 'sudo /sbin/iptables -I %s%s-p %s --dport %s -j DROP -m comment --comment "network throttler blocker rule"';
	var IPTABLES_UNBLOCK_TRAFFIC_CMD 	= 'sudo /sbin/iptables -D %s%s-p %s --dport %s -j DROP -m comment --comment "network throttler blocker rule"';
	var IPTABLES_CHECK_CMD 				= 'sudo iptables --list'
	var IPTABLES_BLOCKER_EXISTS_CMD   	= 'sudo iptables --list | grep "network throttler blocker rule"'


	function start(conf) {

		var direction = getTrafficDirectionForCmd(conf.direction);
		var interfaceParam = util.format(" -i %s ", conf.netInterface);
		if (direction == "OUTPUT") {
			interfaceParam = " ";
		}

		var cmd = util.format(IPTABLES_BLOCK_TRAFFIC_CMD, direction, interfaceParam, conf.proto, conf.port);
		console.log("IPTables start cmd: " + cmd);
		return throttler_exec.executeSync(cmd);
	}

	function stop(conf) {

		var direction = getTrafficDirectionForCmd(conf.direction);
		var interfaceParam = util.format(" -i %s ", conf.netInterface);
		if (direction == "OUTPUT") {
			interfaceParam = " ";
		}

		var cmd = util.format(IPTABLES_UNBLOCK_TRAFFIC_CMD, direction, interfaceParam, conf.proto, conf.port);
		console.log("IPTables stop cmd: " + cmd);
		return throttler_exec.executeSync(cmd);
	}

	function list() {
		return throttler_exec.executeSync(IPTABLES_CHECK_CMD);
	}

	function check() {
		return throttler_exec.executeSync(IPTABLES_CHECK_CMD);
	}

	function exists() {
		var res = throttler_exec.executeSync(IPTABLES_BLOCKER_EXISTS_CMD);
		if (res.status == throttler_exec.FAILED_STATUS) {
			return false;
		}
		return res.message != undefined 
			&& res.message.length > 0;
	}

	function getTrafficDirectionForCmd(direction) {
		if (direction == "inbound") {
			return "INPUT";
		}
		else if (direction == "outbound") {
			return "OUTPUT"
		}
		else {
			return "FORWARD"
		}
	}

	return {
		startBlocking: start,
		stopBlocking: stop,
		listBlocking: list,
		checkBlocking: check,
		existsBlocking: exists
	}
});