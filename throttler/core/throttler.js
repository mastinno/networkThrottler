define([
	'throttler_ipfw',
	'throttler_tc',
	'throttler_exec'
], function(ipfw, tc, throttler_exec) {

	var LINUX_OS_NAME 	= "linux";
	var DARWIN_OS_NAME 	= "darwin";
	var FREEBSD_OS_NAME = "freebsd";
	var WIN_OS_NAME   	= "windows";

	var INIT_STATUS  = "Initilized";
	var STARTED_STATUS  = "Started";
	var STOPPED_STATUS  = "Stopped";

	var _profiles;
	var _throttlerStatus;
	var _currentConf;
	var _defaultNetInterface;

	function init(conf) {
		_profiles = conf.throttlerProfiles;
		_defaultNetInterface = conf.throttlerInterface;
		_throttlerStatus = INIT_STATUS;
		console.log("Throttler configuration:\nProfiles: " + JSON.stringify(_profiles) + "\nDefault Net Interface: " + _defaultNetInterface);
	}

	function getExecutor() {

		var executor;

		switch(process.platform) {
			case LINUX_OS_NAME:
				executor = tc;
				break;
			case DARWIN_OS_NAME:
				executor = ipfw;
				break;
			case FREEBSD_OS_NAME:
				executor = ipfw;
				break;
			case WIN_OS_NAME:
				break;
			default:
				break;
		}

		if (!executor) {
			throw "OS is not supported";
		}
		return executor;
	}

	function validateConf(conf) {
		var error = false;
		var errorMsg = "Invalid ";
		if (!isInteger(conf.latency, true)) {
			errorMsg += "latency (only integer)";
			error = true;
		}
		if (!isInteger(conf.jitter, false)) {
			errorMsg += ", jitter (only integer)";
			error = true;
		}
		if (!isInteger(conf.bandwidth, true)) {
			errorMsg += ", bandwidth (only integer)";
			error = true;
		}
		if (!isNumber(conf.packetLoss, true)) {
			errorMsg += ", packets loss (only number)";
			error = true;
		}
		if (!isNumber(conf.packetDuplication, false)) {
			errorMsg += ", packets duplication (only number)";
			error = true;
		}
		if (!isNumber(conf.packetCorruption, false)) {
			errorMsg += ", packets corruption (only number)";
			error = true;
		}
		if (conf.netInterface.indexOf('wlan') == -1) {
			errorMsg += ", network interface (e.g. wlan..)";
			error = true;
		}
		if (error) {
			errorMsg += ".";
			return {status: throttler_exec.FAILED_STATUS, message: errorMsg};
		}
		return {status: throttler_exec.SUCCESS_STATUS};
	}

	function isNumber(value, checkIfNotBlank) {
	    if ((undefined === value) || (null === value) || ("" == value)) {
	        return checkIfNotBlank ? false : true;
	    }
	    if (typeof value == 'number') {
	        return true;
	    }
	    return !isNaN(value - 0);
	}

	function isInteger(value, checkIfNotBlank) {
	    if ((undefined === value) || (null === value) || ("" == value)) {
	        return checkIfNotBlank ? false : true;
	    }
	    return value % 1 == 0;
	}

	function startSafe(conf) {
		var res = {};
		try {
			res = start(conf);
		}
		catch(err) {
			console.error("Throttler start error: " + err);
			res = {
				status: throttler_exec.FAILED_STATUS, 
				message: err.message
			};
		}
		return res;
	}

	function start(conf) {

		if (!conf.netInterface
			|| conf.netInterface.length == 0) {
			conf.netInterface = _defaultNetInterface;
		}

		var res = validateConf(conf);
		if (res.status != throttler_exec.SUCCESS_STATUS) {
			console.log("Can't start Throttler - bad config. Error: " + JSON.stringify(res));
			return res;
		}

		var restarted = false;
		if (_throttlerStatus == STARTED_STATUS) {
			var res = stop();
			if (res.status != throttler_exec.SUCCESS_STATUS) {
				console.log("Can't re-start Throttler. Error: " + JSON.stringify(res));
				return {status: throttler_exec.FAILED_STATUS, message: res.message};
			}
			restarted = true;
		}

		res = getExecutor().start(conf);
		if (res.status != throttler_exec.SUCCESS_STATUS) {
			console.log("Can't start Throttler. Error: " + JSON.stringify(res));
			return res;
		}
		_currentConf = conf;
		_throttlerStatus = STARTED_STATUS;
		return {
			status:res.status, 
			message: restarted ? "Throttler was re-started" : "Throttler was started", 
			throttlerStatus: {status: STARTED_STATUS, config: _currentConf}
		};
	}

	function stopSafe() {
		try {
			return stop();
		}
		catch(err) {
			console.error("Throttler stop error: " + err);
			return {
				status: throttler_exec.FAILED_STAUS, 
				message: err.message
			};
		}
	}

	function stop() {

		if (!_currentConf) {
			console.log("Throttler wasn't started - nothing to stop");
			return {status:throttler_exec.FAILED_STATUS, message: "Throttler wasn't started"};
		}
		var res = getExecutor().stop(_currentConf);
		if (res.status != throttler_exec.SUCCESS_STATUS) {
			console.log("Can't stop Throttler. Error: " + JSON.stringify(res));
			return res;
		}
		_currentConf = undefined;
		_throttlerStatus = STOPPED_STATUS;
		return {
			status:res.status, 
			message: "Throttler was stopped", 
			throttlerStatus: {status: STOPPED_STATUS}
		};
	}

	function check() {
		return getExecutor().check();
	}

	function list() {
		return getExecutor().list();
	}

	function exists() {
		return getExecutor().exists();
	}

	function getProfilesList() {
		return _profiles;
	}

	function getStatus() {
		
		var result = {status:_throttlerStatus};
		if (_currentConf) {
			result.config = _currentConf;
		}
		var listRes = list();
		if (listRes.status == throttler_exec.SUCCESS_STATUS) {
			result.shellOutput = listRes.message;
		}
		return result;
	}

	function getCurrentConfig() {
		return _currentConf;
	}

	function execCmd(cmd) {
		return throttler_exec.executeSync(cmd);
	}

	return {
		init: init,
		start: startSafe,
		stop: stopSafe,
		list: list,
		check: check,
		exists: exists,
		getProfilesList: getProfilesList,
		getStatus: getStatus,
		getCurrentConfig: getCurrentConfig,
		execCmd: execCmd
	}
});