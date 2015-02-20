define([
	'express_app',
	'throttler'
], function(express_app, throttler) {

	var GET_PROFILE_LIST_PATH = "/throttler/api/profiles";
	var START_THROTTLER_PATH = "/throttler/api/start";
	var STOP_THROTTLER_PATH = "/throttler/api/stop";
	var GET_THROTTLER_STATUS_PATH = "/throttler/api/status";
	var EXECUTE_CMD_PATH = "/throttler/api/execute";

	function init() {

		console.log("Initiating REST API...");
		express_app.add_path("GET", GET_PROFILE_LIST_PATH, getProfilesList);
		express_app.add_path("POST", START_THROTTLER_PATH, startThrottler);
		express_app.add_path("POST", STOP_THROTTLER_PATH, stopThrottler);
		express_app.add_path("GET", GET_THROTTLER_STATUS_PATH, getStatus);
		express_app.add_path("POST", EXECUTE_CMD_PATH, execCmd);
	}

	function getProfilesList(req, res) {
		res.send(JSON.stringify(throttler.getProfilesList()));
	};

	function startThrottler(req, res) {
		res.send(JSON.stringify(throttler.start()));
	};

	function stopThrottler(req, res) {
		res.send(JSON.stringify(throttler.stop()));
	};

	function getStatus(req, res) {
		var res = {status: throttler.getStatus(), config: throttler.getCurrentConfig()};
		res.send(res);
	};

	function execCmd(req, res) {
		// res.send(throttler.execCmd(req.body.cmd));
	}

	return {
		init: init
	};
});