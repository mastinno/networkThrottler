define([
	'throttler_exec'
], function(throttler_exec) {

	function checkForUpdate() {

		var res = throttler_exec.executeSync("git pull");
		if (res.status == throttler_exec.FAILED_STATUS) {
			return {
				status: throttler_exec.FAILED_STATUS,
				message: "Can't check updates. Please try later."
			};
		}

		if (res.message.indexOf("Already up-to-date") >=0 ) {
			return res;
		}

		return {
			status: throttler_exec.SUCCESS_STATUS,
			message: "Update was found and server will be restarted. Please reload the current page to get the latest updates."
		};
	}

	return {
		checkForUpdate: checkForUpdate
	}
});