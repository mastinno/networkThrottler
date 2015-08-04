define([
	'throttler_ipfw',
	'blocker_iptables',
	'throttler_exec',
	'utils',
	'underscore',
	'fs'
], function(ipfw, iptables, throttler_exec, utils, _, fs) {

	var CURRENT_STATUS_FILE_PATH = "./conf/blockerStatus.json"
	var LINUX_OS_NAME 	= "linux";
	var DARWIN_OS_NAME 	= "darwin";
	var FREEBSD_OS_NAME = "freebsd";
	var WIN_OS_NAME   	= "windows";

	var INIT_STATUS  = "Initilized";
	var STARTED_STATUS  = "Started";
	var STOPPED_STATUS  = "Stopped";

	var _blockerProtocols;
	var _blockerTraficTypes;
	var _blockerStatus;
	var _currentConf;

	function init(conf) {

		if (fs.existsSync(CURRENT_STATUS_FILE_PATH)) {
			try {
				var currentStatus = JSON.parse(fs.readFileSync(CURRENT_STATUS_FILE_PATH, {encoding:'utf8'}));
				_currentConf = currentStatus.conf;
				_blockerStatus = currentStatus.status;
			}
			catch(err) {
				console.error("Failed read current configuration: " + err + ". Removing broken file.");
				fs.unlinkSync(CURRENT_STATUS_FILE_PATH);
				_currentConf = undefined;
				_blockerStatus = undefined;
			}
		}

		if (!_blockerStatus) {
			_blockerStatus = INIT_STATUS;
		}

		_blockerProtocols = conf.blockerProtocols;
		_blockerTraficTypes = conf.blockerTraficTypes;

		console.log("Blocker configuration:\n\tSupported Protocols: " 
			+ JSON.stringify(_blockerProtocols)
			+ "\n\tSupported Traffic Types: "
			+ JSON.stringify(_blockerTraficTypes)
			+ "\n\tCurrent configuration: "
			+ JSON.stringify(_currentConf)
			+ "\n\tCurrent Status: "
			+ _blockerStatus);
	}

	function getExecutor() {

		var executor;

		switch(process.platform) {
			case LINUX_OS_NAME:
				executor = iptables;
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

		if (!_.contains(getBlockerTrafficTypes(), conf.direction)) {
			errorMsg += " invalid traffic direction (only " + JSON.stringify(getBlockerTrafficTypes()) + " are supported);";
			error = true;
		}
		if (!_.contains(getBlockerProtocols(), conf.proto)) {
			errorMsg += " invalid protocol (only " + JSON.stringify(getBlockerProtocols()) + " are supported);";
			error = true;
		}
		if (!utils.isInteger(conf.port, true)) {
			errorMsg += " invalid port (only integer);";
			error = true;
		}
		if (conf.port == "22") {
			errorMsg += " can't block SSH port :) ;";
			error = true;
		}
		if (conf.port == "5000") {
			errorMsg += " can't block Throttler web-application port :) ;";
			error = true;
		}
		if (!utils.isValidNetworkInterface(conf.netInterface)) {
			errorMsg += " " + conf.netInterface + " is invalid network inteface;";
			error = true;
		}

		if (error) {
			return {status: throttler_exec.FAILED_STATUS, message: errorMsg};
		}
		return {status: throttler_exec.SUCCESS_STATUS};
	}

	function check() {
		return getExecutor().checkBlocking();
	}

	function list() {
		return getExecutor().listBlocking();
	}

	function exists() {
		return getExecutor().existsBlocking();
	}

	function getStatus() {
		
		var result = {status:_blockerStatus};
		if (_currentConf) {
			result.config = _currentConf;
		}
		var listRes = list();
		if (listRes.status == throttler_exec.SUCCESS_STATUS) {
			result.shellOutput = listRes.message;
		}
		return result;
	}

	function startSafe(conf) {
		var res = {};
		try {
			res = startBlocker(conf);
		}
		catch(err) {
			console.error("Blocker start error: " + err);
			res = {
				status: throttler_exec.FAILED_STATUS, 
				message: err.message
			};
		}
		return res;
	}

	function startBlocker(conf) {

		var res = validateConf(conf);
		if (res.status != throttler_exec.SUCCESS_STATUS) {
			console.log("Can't start Blocker - bad config. Error: " + JSON.stringify(res));
			return res;
		}

		var restarted = false;
		if (_blockerStatus == STARTED_STATUS) {
			var res = stop();
			if (res.status != throttler_exec.SUCCESS_STATUS) {
				console.log("Can't re-start Blocker. Error: " + JSON.stringify(res));
				return {status: throttler_exec.FAILED_STATUS, message: res.message};
			}
			restarted = true;
		}

		res = getExecutor().startBlocking(conf);
		if (res.status != throttler_exec.SUCCESS_STATUS) {
			console.log("Can't start Blocker. Error: " + JSON.stringify(res));
			return res;
		}
		_currentConf = conf;
		_blockerStatus = STARTED_STATUS;
		fs.writeFileSync(CURRENT_STATUS_FILE_PATH, JSON.stringify({conf: _currentConf, status: _blockerStatus}));
		return {
			status:res.status, 
			message: restarted ? "Blocker was re-started" : "Blocker was started", 
			throttlerStatus: {status: STARTED_STATUS, config: _currentConf}
		};
	}

	function stopSafe() {
		try {
			return stop();
		}
		catch(err) {
			console.error("Blocker stop error: " + err);
			return {
				status: throttler_exec.FAILED_STAUS, 
				message: err.message
			};
		}
	}

	function stop() {

		if (!_currentConf) {
			console.log("Blocker wasn't started - nothing to stop");
			return {status:throttler_exec.FAILED_STATUS, message: "Blocker wasn't started"};
		}
		var res = getExecutor().stopBlocking(_currentConf);
		if (res.status != throttler_exec.SUCCESS_STATUS) {
			console.log("Can't stop Blocker. Error: " + JSON.stringify(res));
			return res;
		}
		_currentConf = undefined;
		_blockerStatus = STOPPED_STATUS;
		fs.unlinkSync(CURRENT_STATUS_FILE_PATH);
		return {
			status:res.status, 
			message: "Blocker was stopped", 
			throttlerStatus: {status: STOPPED_STATUS}
		};
	}

	function getCurrentConfig() {
		return _currentConf;
	}

	function getBlockerProtocols() {
		return _blockerProtocols;
	}

	function getBlockerTrafficTypes() {
		return _blockerTraficTypes;
	}

	return {
		init: init,
		start: startSafe,
		stop: stopSafe,
		list: list,
		check: check,
		exists: exists,
		getStatus: getStatus,
		getBlockerProtocols: getBlockerProtocols,
		getBlockerTrafficTypes: getBlockerTrafficTypes
	}
});
