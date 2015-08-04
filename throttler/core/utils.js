define([
	'os',
	'underscore'
], function(os, _) {

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
		isNumber: isNumber,
		isInteger: isInteger,
		getNetworkInterfacesNames: getNetworkInterfacesNames,
		isValidNetworkInterface: isValidNetworkInterface
	}
});