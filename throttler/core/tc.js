define([
	'throttler_exec',
	'util'
], function(throttler_exec, util) {

	var TC_ADD_ROOT_QDISC 	= 'sudo tc qdisc add dev %s root handle 1: htb default 12';
	var TC_ADD_TARGET_CLASS = 'sudo tc class add dev %s parent 1:1 classid 1:12 htb rate %s ceil %s';
	var TC_ADD_NETEM_RULE 	= 'sudo tc qdisc add dev %s parent 1:12 netem';
	var TC_DEL_ROTT_QDISC   = 'sudo tc qdisc del root dev %s';
	var TC_EXISTS       	= 'sudo tc qdisc show | grep "netem"';
	var TC_CHECK        	= 'sudo tc -s qdisc';

	function start(conf) {

		console.log("TC start conf " + JSON.stringify(conf));
		var res = addRootQDisc(conf);
		if (res.status == throttler_exec.FAILED_STATUS) {
			return res;
		}
		res = addTargetClass(conf);
		if (res.status == throttler_exec.FAILED_STATUS) {
			return res;
		}
		res = addNetemRule(conf);
		if (res.status == throttler_exec.FAILED_STATUS) {
			return res;
		}
		return res;
	}

	function stop(conf) {
		return delRootQDisc(conf);
	}

	function check() {
		return throttler_exec.executeSync(TC_CHECK);
	}

	function list() {
		return throttler_exec.executeSync(TC_CHECK);
	}

	function exists() {
		var res = throttler_exec.executeSync(TC_EXISTS);
		if (res.status == throttler_exec.FAILED_STATUS) {
			return false;
		}
		return res.message != undefined 
			&& res.message.length > 0;
	}

	function addRootQDisc(conf) {
		var cmd = util.format(TC_ADD_ROOT_QDISC, conf.netInterface);
		console.log("addRootQDisc cmd: " + cmd);
		return throttler_exec.executeSync(cmd);
	}

	function addTargetClass(conf) {

		var rate = getBwRate(conf.defaultBandwidth);
		var cmd = util.format(TC_ADD_TARGET_CLASS, conf.netInterface, rate, rate);
		console.log("addTargetClass cmd: " + cmd);
		return throttler_exec.executeSync(cmd);
	}

	function addNetemRule(conf) {

		var cmd = util.format(TC_ADD_NETEM_RULE, conf.netInterface);
		if (conf.latency && conf.latency.length > 0) {
			if (conf.jitter && conf.jitter.length > 0) {
				if (conf.jitterCorellation && conf.jitterCorellation.length > 0) {
					cmd += util.format(" delay %sms %sms %s%%", conf.latency, conf.jitter, conf.jitterCorellation);
				}
				else {
					cmd += util.format(" delay %sms %sms", conf.latency, conf.jitter);
				}
			}
			else {
				cmd += util.format(" delay %sms", conf.latency);
			}
		}
		if (conf.packetLoss && conf.packetLoss.length > 0) {
			if (conf.packetLossCorellation && conf.packetLossCorellation.length > 0) {
				cmd += util.format(" loss %d%% %s%%", parseFloat(conf.packetLoss).toFixed(2), conf.packetLossCorellation);
			}
			else {
				cmd += util.format(" loss %d%%", parseFloat(conf.packetLoss).toFixed(2));
			}
		}
		if (conf.packetDuplication && conf.packetDuplication.length > 0) {
			cmd += util.format(" duplicate %d%%", conf.packetDuplication);
		}

		if (conf.packetCorruption && conf.packetCorruption.length > 0) {
			cmd += util.format(" corrupt %d%%", conf.packetCorruption);
		}
		
		console.log("addNetemRule cmd: " + cmd);
		return throttler_exec.executeSync(cmd);
	}

	function delRootQDisc(conf) {

		var cmd = util.format(TC_DEL_ROTT_QDISC, conf.netInterface);
		console.log("delRootQDisc cmd: " + cmd);
		return throttler_exec.executeSync(cmd);
	}

	function getBwRate(bw) {
		if (bw && bw.length > 0) {
			rate = util.format("%skbit", bw);
		} else {
			rate = "1000000kbit";
		}
		return rate;
	}

	return {
		start: start,
		stop: stop,
		list: list,
		check: check,
		exists: exists
	}
});