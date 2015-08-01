define([
    'express',
    'http',
    'body-parser',
    'socket.io',
    'throttler',
    'throttler_updater'
], function(express, http, bodyParser, io, throttler, throttler_updater) {

    var app;
    var sio;
    var __dirname;

    function add_path(method, path, callback) {
        console.log("Adding handler for HTTP method " + method + " path " + path);
        switch (method.toUpperCase()) {
            case 'GET':
                app.get(path, function(req, res) {
                    console.log('GET: "' + path + '"');
                    callback(req, res);
                });
                break;
            case 'POST':
                app.post(path, function(req, res) {
                    console.log('POST: "' + path + '"' + ' with body ' + req.body);
                    callback(req, res);
                });
                break;
            case 'PUT':
                break;
            case 'DELETE':
                break;
        }
    };

    function init(conf) {

        __dirname = conf.server_path;

        app = express();
        app.set('port', conf.http.port);

        app.use(bodyParser.urlencoded({
          extended: true
        }));
        app.use(bodyParser.json());

        app.use(express.static(__dirname + '/web/client'));
        app.use(express.static(__dirname + '/node_modules'));

        // app.use(error.handler);

        app.set('views', __dirname + '/web/client/views');
        app.set('view engine', 'ejs');

        add_path("GET", "/", loadMainView);

        sio = io.listen(app.listen(conf.http.port, function() {
          console.log('Throttler server listening on port ' + conf.http.port);
        }));

        sio.sockets.on('connection', function(socket) {

            socket.on('startThrottler', function(conf, callback) {
                console.log('Throttler start conf ' + JSON.stringify(conf));
                var res = throttler.start(conf);
                console.log("Throttler start result - " + JSON.stringify(res));
                callback(res);
            });

            socket.on('stopThrottler', function(callback) {
                var res = throttler.stop();
                console.log("Throttler stop result - " + JSON.stringify(res));
                callback(res);
            });

            socket.on('getStatus', function(callback) {
                var res = throttler.getStatus();
                console.log("Throttler get status - " + JSON.stringify(res));
                callback(res);
            });

            socket.on('checkForUpdates', function(callback) {
                callback(throttler_updater.checkForUpdate());
            });   
        });
    };

    function loadMainView(req, res) {
        res.render('index', {  
            profiles: JSON.stringify(throttler.getProfilesList()),
            status: JSON.stringify(throttler.getStatus()),
            ifaces: JSON.stringify(throttler.getNetworkInterfacesNames()),
            blockerProtocols: JSON.stringify(throttler.getBlockerProtocols()),
            trafficTypes: JSON.stringify(throttler.getBlockerTrafficTypes())
        });
    }

    return {
        init: init,
        add_path: add_path
    };
});