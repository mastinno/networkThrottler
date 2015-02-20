define([
	'child_process'
], function(child_process) {

	var _SUCCESS_STATUS 	= "Success";
	var _FAILED_STATUS 	= "Failed";

	function executeSync(cmd) {
		
		console.log("Executing cmd: " + cmd);
		var result = {};
		try {
	        result.message = child_process.execSync(cmd, {"encoding":"utf-8"});
	        result.status = _SUCCESS_STATUS;
	    }
	    catch (err) {
	    	result.message = err;
	        result.status = _FAILED_STATUS;
	    }
	    console.log("Executed cmd result: " + JSON.stringify(result));
	    return result;
	}

	return {

		SUCCESS_STATUS: _SUCCESS_STATUS,
		FAILED_STATUS : _FAILED_STATUS,

		executeSync: executeSync
	}
});