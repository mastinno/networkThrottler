define([
	'throttler_ipfw',
	'throttler_tc',
	'throttler_exec',
	'os',
	'underscore'
], function(ipfw, tc, throttler_exec, os, _) {

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

	function init(conf) {
		_profiles = conf.throttlerProfiles;
		_throttlerStatus = INIT_STATUS;
		console.log("Throttler configuration:\nProfiles: " + JSON.stringify(_profiles));
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
		var errorMsg = "Configuration has following error(s):";

		if (!isInteger(conf.latency, true)) {
			errorMsg += " invalid latency (only integer);";
			error = true;
		}
		if (!isInteger(conf.jitter, false)) {
			errorMsg += " invalid jitter (only integer);";
			error = true;
		}
		if (!isInteger(conf.bandwidth, true)) {
			errorMsg += " invalid bandwidth (only integer);";
			error = true;
		}
		if (!isNumber(conf.packetLoss, true)) {
			errorMsg += " invalid packets loss (only number);";
			error = true;
		}
		if (!isNumber(conf.packetDuplication, false)) {
			errorMsg += " invalid packets duplication (only number);";
			error = true;
		}
		if (!isNumber(conf.packetCorruption, false)) {
			errorMsg += " invalid packets corruption (only number);";
			error = true;
		}
		if (!isValidNetworkInterface(conf.netInterface)) {
			errorMsg += " " + conf.netInterface + " is invalid network inteface;";
			error = true;
		}

		if (error) {
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

	function getNetworkInterfacesNames() {

		var ifaces = os.networkInterfaces();
		var res = [];
		console.log("Available netwrok interfaces: " + JSON.stringify(ifaces));
		_.keys(ifaces).forEach(function(iface) {
		  console.log("Interface: " + iface);
		  res.push(iface);
		});
		return res;
	}

	function isValidNetworkInterface(iface) {
		if (!iface || iface.length == 0) {
			return false;
		}
		var availableIfaces = getNetworkInterfacesNames();
		var isValid = false;
		_.each(availableIfaces, function(i) {
			if (i == iface) {
				isValid = true;
			}
		});
		return isValid;
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
		execCmd: execCmd,
		getNetworkInterfacesNames: getNetworkInterfacesNames
	}
});
