define([
	'throttler_exec',
	'util'
], function(throttler_exec, util) {

	var IPTABLES_BLOCK_TRAFFIC_CMD 		= 'sudo /sbin/iptables -A %s -i %s -p %s --dport %s -j DROP;sudo /sbin/service iptables save';
	var IPTABLES_UNBLOCK_TRAFFIC_CMD 	= 'sudo /sbin/iptables -D %s -i %s -p %s --dport %s -j DROP;sudo /sbin/service iptables save';


	function start(conf) {
		var cmd = util.format(IPTABLES_BLOCK_TRAFFIC_CMD, getTrafficDirectionForCmd(conf.direction), conf.iface, conf.proto, conf.port);
		console.log("IPTables start cmd: " + cmd);
		return throttler_exec.executeSync(cmd);
	}

	function stop(conf) {
		var cmd = util.format(IPTABLES_UNBLOCK_TRAFFIC_CMD, getTrafficDirectionForCmd(conf.direction), conf.iface, conf.proto, conf.port);
		console.log("IPTables stop cmd: " + cmd);
		return throttler_exec.executeSync(cmd);
	}

	function list() {

	}

	function check() {

	}

	function exists() {

	}

	function getTrafficDirectionForCmd(direction) {
		if (direction == "inbound") {
			return "INPUT";
		}
		else {
			return "OUTPUT"
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