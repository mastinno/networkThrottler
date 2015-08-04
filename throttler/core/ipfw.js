define([
	'throttler_exec',
	'util'
], function(throttler_exec, util) {

	var IPWF_ADD_PIPE_CMD  		= 'sudo ipfw add 1 pipe 1 ip from any to any via '
	var IPWF_DELETE_PIPE_CMD 	= 'sudo ipfw delete 1'
	var IPWF_CONFIG_CMD 		= 'sudo ipfw pipe 1 config'
	var IPWF_EXISTS_CMD   		= 'sudo ipfw list | grep "pipe 1"'
	var IPWF_CHECK_CMD    		= 'sudo ipfw list'

	var IPWF_BLOCK_TRAFFIC_CMD 		= 'sudo ipfw add 200 deny %s from any to any %s %s via %s'
	var IPWF_UNBLOCK_TRAFFIC_CMD 	= 'sudo ipfw del 200'
	var IPWF_BLOCKER_EXISTS_CMD   	= 'sudo ipfw list | grep "200"'
	var IPWF_BLOCKER_CHECK_CMD    	= 'sudo ipfw list'

	function start(conf) {

		console.log("IPWF start conf " + JSON.stringify(conf) + ", cmd - " + IPWF_ADD_PIPE_CMD + conf.netInterface);

		var res = throttler_exec.executeSync(IPWF_ADD_PIPE_CMD + conf.netInterface);
		if (res.status == throttler_exec.FAILED_STATUS) {
			return res;
		}

		return throttler_exec.executeSync(buildStartCmd(conf));
	}

	function stop(conf) {
		return throttler_exec.executeSync(IPWF_DELETE_PIPE_CMD);
	}

	function check() {
		return throttler_exec.executeSync(IPWF_CHECK_CMD);
	}

	function list() {
		return throttler_exec.executeSync(IPWF_CHECK_CMD);
	}

	function exists() {
		var res = throttler_exec.executeSync(IPWF_EXISTS_CMD);
		if (res.status == throttler_exec.FAILED_STATUS) {
			return false;
		}
		return res.message != undefined 
			&& res.message.length > 0;
	}

	function buildStartCmd(conf) {
		var cmd = IPWF_CONFIG_CMD;
		if (conf.latency
			&& conf.latency.length > 0) {
			cmd = cmd + " delay " + conf.latency + "ms";
		}
		if (conf.bandwidth
			&& conf.bandwidth.length > 0) {
			cmd = cmd + " bw " + conf.bandwidth + "Kbit/s";
		}
		if (conf.packetLoss
			&& conf.packetLoss.length > 0) {
			cmd = cmd + " plr " + (conf.packetLoss/100).toFixed(4);
		}
		return cmd;
	}

	function startBlocking(conf) {
		var cmd = util.format(IPWF_BLOCK_TRAFFIC_CMD, conf.proto, conf.port, getTrafficDirectionForCmd(conf.direction), conf.netInterface);
		console.log("IPFW Blocker start cmd: " + cmd);
		return throttler_exec.executeSync(cmd);
	}

	function stopBlocking(conf) {
		console.log("IPFW Blocker stop cmd: " + IPWF_UNBLOCK_TRAFFIC_CMD);
		return throttler_exec.executeSync(IPWF_UNBLOCK_TRAFFIC_CMD);
	}

	function listBlocking() {
		return throttler_exec.executeSync(IPWF_BLOCKER_CHECK_CMD);
	}

	function checkBlocking() {
		return throttler_exec.executeSync(IPWF_BLOCKER_CHECK_CMD);
	}

	function existsBlocking() {
		var res = throttler_exec.executeSync(IPWF_BLOCKER_EXISTS_CMD);
		if (res.status == throttler_exec.FAILED_STATUS) {
			return false;
		}
		return res.message != undefined 
			&& res.message.length > 0;
	}

	function getTrafficDirectionForCmd(direction) {
		if (direction == "inbound") {
			return "in";
		}
		else {
			return "out"
		}
	}

	return {
		start: start,
		stop: stop,
		list: list,
		check: check,
		exists: exists,

		startBlocking: startBlocking,
		stopBlocking: stopBlocking,
		listBlocking: listBlocking,
		checkBlocking: checkBlocking,
		existsBlocking: existsBlocking
	}
});