var http = require("http");
var functions = require("./functions");


// Start the presence manager
functions.PresenceManager();

http.createServer(function (req, res) {  // Start the HTTP server
    functions.processRequest(req, res, () => {
        return res.end();
    });
}).listen(8080);