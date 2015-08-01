var requirejs = require('requirejs');

// Do some configuration of requirejs module
requirejs.config({
    nodeRequire: require,
    baseUrl: '',
    paths: {
        'express_app': 'web/core/express_app',
        'throttler_rest': 'web/rest/api',
        'throttler_updater': 'throttler/core/throttler_updater',
        'throttler': 'throttler/core/throttler',
        'throttler_ipfw': 'throttler/core/ipfw',
        'throttler_tc': 'throttler/core/tc',
        'blocker_iptables': 'throttler/core/iptables',
        'throttler_exec': 'throttler/core/throttler_exec'
    }
});

requirejs(['nconf', 'express_app', 'throttler', 'throttler_rest'], 
    function(nconf, express_app, throttler, throttler_rest) {

    console.log("OS: " + process.platform);

    nconf.argv().env().file({
                file: './conf/throttler.json'
            });

    nconf.set("server_path", __dirname);
    var conf = nconf.get();
    console.log(JSON.stringify(conf));

    throttler.init(conf);
    express_app.init(conf);
    throttler_rest.init();
});