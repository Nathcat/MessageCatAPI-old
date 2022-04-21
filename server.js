var http = require("http");
var url = require("url");
var mysql = require("mysql");
var fs = require("fs");
const { setDefaultResultOrder } = require("dns");

http.createServer(function (req, res) {
    // Parse the URL to check the requested action
    var path = url.parse(req.url, true).pathname;

    if (path === "/api/getuser") {  // Get user data from SQL database
        if (req.method == "GET") {
            res.writeHead(200, {
                "Access-Control-Allow-Origin": "*",
                "Content-Type": "text/html"
            });
    
            res.end("<h1>Invalid method</h1>");
        }

        res.writeHead(200, {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "application/json"
        });

        GetUser(req, (users) => {
            if (users.length == 1) {
                return res.end(JSON.stringify(users[0]));
            }
            else {
                return res.end(JSON.stringify({"email": "", "password": ""}))
            }
        });
    }
    else if (path.includes("/api/pfps")) {  // Get pfp from server
        res.writeHead(200, {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "image/png"
        });
        
        var callback = (pfp_path) => {
            let stream = fs.createReadStream("./pfps/" + pfp_path);

            stream.on("open", () => {
                stream.pipe(res);
            });
        };

        let buffers = [];
        req.on("data", (chunk) => {
            buffers.push(chunk);
        });
    
        req.on("end", () => {
            let split_path = path.split("/");
            let pfp_path = split_path[split_path.length - 1];
            return callback(pfp_path);
        });
    }
    else if (path === "/api/createuser") {  // Create a new user
        if (req.method == "GET") {
            res.writeHead(200, {
                "Access-Control-Allow-Origin": "*",
                "Content-Type": "text/html"
            });
    
            res.end("<h1>Invalid method</h1>");
        }

        res.writeHead(200, {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "application/json"
        });

        let buffers = [];
        req.on("data", (chunk) => {
            buffers.push(chunk);
        });
    
        req.on("end", () => {
            let userData = JSON.parse(buffers.concat());
            CreateUser(userData, () => {
                RequestUser(userData.email, (users) => {
                    if (users.length == 1) {
                        return res.end(JSON.stringify(users[0]));
                    }
                    else {
                        return res.end(JSON.stringify({"email": "", "password": ""}))
                    }
                });
            });
        });
    }
    else if (path === "/api/getfriends"){
        if (req.method == "GET") {
            res.writeHead(200, {
                "Access-Control-Allow-Origin": "*",
                "Content-Type": "text/html"
            });
    
            res.end("<h1>Invalid method</h1>");
        }

        res.writeHead(200, {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "text/plain"
        });
        
        let buffers = [];
        req.on("data", (chunk) => {
            buffers.push(chunk);
        });
    
        req.on("end", () => {
            let body = JSON.parse(buffers.concat());
            GetFriends(body.ID, async(friendRecords) => {
                var friendsData = [];
                for (let i = 0; i < friendRecords.length; i++) {
                    let record = JSON.parse(JSON.stringify(friendRecords[i]));
                    RequestUserByID(record.friend, (results) => {
                        if (results.length == 1) {
                            let userRecord = results[0];
                            friendsData.push(JSON.stringify(userRecord));
                            if (friendsData.length == friendRecords.length) { 
                                return res.end(friendsData.join("<[SePaRaToR]>"));
                            }
                        }
                    });
                }
            });
        });
    }
    else if (path === "/api/sendmessage") {
        if (req.method == "GET") {
            res.writeHead(200, {
                "Access-Control-Allow-Origin": "*",
                "Content-Type": "text/html"
            });
    
            res.end("<h1>Invalid method</h1>");
        }

        res.writeHead(200, {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "text/plain"
        });

        let buffers = [];
        req.on("data", (chunk) => {
            buffers.push(chunk);
        });

        req.on("end", () => {
            let messageJson = JSON.parse(buffers.concat());
            SendMessage(messageJson, () => {
                return res.end("OK");
            });
        });
    }
    else if (path === "/api/getmessages") {
        if (req.method == "GET") {
            res.writeHead(200, {
                "Access-Control-Allow-Origin": "*",
                "Content-Type": "text/html"
            });
    
            res.end("<h1>Invalid method</h1>");
        }

        res.writeHead(200, {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "text/plain"
        });

        let buffers = [];
        req.on("data", (chunk) => {
            buffers.push(chunk);
        });

        req.on("end", () => {
            let data = JSON.parse(buffers.concat());
            GetMessages(data, (results) => {
                if (results) {
                    let messageJsons = results.map((item) => {
                        return JSON.stringify(item);
                    })

                    let messages = messageJsons.join("<[SePaRaToR]>");
                    return res.end(messages);
                }
                else {
                    return res.end("Disconnect");
                }
            });
        });
    }
    else if (path === "/api/sendfriendrequest") {
        if (req.method == "GET") {
            res.writeHead(200, {
                "Access-Control-Allow-Origin": "*",
                "Content-Type": "text/html"
            });
    
            res.end("<h1>Invalid method</h1>");
        }

        res.writeHead(200, {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "text/plain"
        });

        let buffers = [];
        req.on("data", (chunk) => {
            buffers.push(chunk);
        });

        req.on("end", () => {
            let data = JSON.parse(buffers.concat());

            SendFriendRequest(data, () => {
                return res.end("OK");
            });
        });
    }
    else if (path === "/api/acceptfriendrequest") {
        if (req.method == "GET") {
            res.writeHead(200, {
                "Access-Control-Allow-Origin": "*",
                "Content-Type": "text/html"
            });
    
            res.end("<h1>Invalid method</h1>");
        }

        res.writeHead(200, {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "text/plain"
        });

        let buffers = [];
        req.on("data", (chunk) => {
            buffers.push(chunk);
        });

        req.on("end", () => {
            let data = JSON.parse(buffers.concat());

            AcceptFriendRequest(data, () => {
                return res.end("OK");
            });
        });
    }
    else if (path === "/api/getfriendrequests") {
        if (req.method == "GET") {
            res.writeHead(200, {
                "Access-Control-Allow-Origin": "*",
                "Content-Type": "text/html"
            });
    
            res.end("<h1>Invalid method</h1>");
        }

        res.writeHead(200, {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "text/plain"
        });

        let buffers = [];
        req.on("data", (chunk) => {
            buffers.push(chunk);
        });

        req.on("end", () => {
            let data = JSON.parse(buffers.concat());

            GetFriendRequests(data, (result) => {
                return res.end(
                    result.map((item) => {
                        return JSON.stringify(item);
                    }).join("<[SePaRaToR]>")
                );
            });
        });
    }
    else if (path === "/api/declinefriendrequest") {
        if (req.method == "GET") {
            res.writeHead(200, {
                "Access-Control-Allow-Origin": "*",
                "Content-Type": "text/html"
            });
    
            res.end("<h1>Invalid method</h1>");
        }

        res.writeHead(200, {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "text/plain"
        });

        let buffers = [];
        req.on("data", (chunk) => {
            buffers.push(chunk);
        });

        req.on("end", () => {
            let data = JSON.parse(buffers.concat());

            DeclineFriendRequest(data, () => {
                return res.end("OK");
            });
        });
    }

}).listen(8080, "0.0.0.0");

async function GetUser(req, callback) {
    let buffers = [];

    req.on("data", (chunk) => {
        buffers.push(chunk);
    });

    req.on("end", () => {
        email = JSON.parse(buffers.concat()).email;
        RequestUser(email, callback);
    });
}

async function RequestUser(email, callback) {
    var con = mysql.createConnection({
        host: "localhost",
        user: "login",
        password: "",
        database: "messagecat"
      });

    con.connect(function(err) {
        if (err) throw err;
    });

    con.query("SELECT * FROM users WHERE email like '" + email + "'", function (err, result, fields) {
        if (err) throw err;
        con.destroy();
        return callback(result);
    });
}

async function RequestUserByID(id, callback) {
    var con = mysql.createConnection({
        host: "localhost",
        user: "login",
        password: "",
        database: "messagecat"
      });

    con.connect(function(err) {
        if (err) throw err;
    });

    con.query("SELECT * FROM users WHERE ID like " + id + "", async (err, result, fields) => {
        if (err) throw err;
        con.destroy();
        return await callback(result);
    });
}

async function CreateUser(data, callback) {
    data.username = data.username.replaceAll("'", "''");
    data.email = data.email.replaceAll("'", "''");

    RequestUser(data.email, (users) => {
        if (users.length == 0) {
            var con = mysql.createConnection({
                host: "localhost",
                user: "login",
                password: "",
                database: "messagecat"
            });
        
            con.connect(function(err) {
                if (err) throw err;
            });
        
            con.query("INSERT INTO users (username, password, email) values ('" + data.username + "', '" + data.password + "', '" + data.email + "')", function (err, result, fields) {
                if (err) throw err;
                con.destroy();
                callback();
            });
        }
        else if (users.length == 1){
            callback();
        }
    });
}

async function GetFriends(userID, callback) {
    var con = mysql.createConnection({
        host: "localhost",
        user: "login",
        password: "",
        database: "messagecat"
      });

    con.connect(function(err) {
        if (err) throw err;
    });

    con.query("SELECT * FROM friends WHERE userID like " + userID + "", function (err, result, fields) {
        if (err) throw err;
        con.destroy();
        return callback(result);
    });
}

async function SendMessage(messageJson, callback) {
    messageJson.content = messageJson.content.replaceAll("'", "''");

    var con = mysql.createConnection({
        host: "localhost",
        user: "login",
        password: "",
        database: "messagecat"
      });

    con.connect(function(err) {
        if (err) throw err;
    });

    con.query("INSERT INTO messages (senderID, recipientID, content) values (" + messageJson.senderID +  ", " + messageJson.recipientID + ", '" + messageJson.content + "')", function (err, result, fields) {
        if (err) throw err;
        con.destroy();
        return callback();
    });
}

async function GetMessages(data, callback) {
    var con = mysql.createConnection({
        host: "localhost",
        user: "login",
        password: "",
        database: "messagecat"
      });

    con.connect(function(err) {
        if (err) throw err;
    });

    con.query("SELECT * FROM messages WHERE (senderID like " + data.userID + " and recipientID like " + data.friendID + ") or (senderID like " + data.friendID + " and recipientID like " + data.userID + ")", function (err, result, fields) {
        //if (err) throw err;
        con.destroy();
        return callback(result);
    });
}

async function SendFriendRequest(data, callback) {
    var con = mysql.createConnection({
        host: "localhost",
        user: "login",
        password: "",
        database: "messagecat"
      });

    con.connect(function(err) {
        if (err) throw err;
    });

    con.query("INSERT INTO `friend-requests` (senderID, recipientID) values (" + data.senderID + ", " + data.recipientID + ")", function (err, result, fields) {
        //if (err) throw err;
        con.destroy();
        return callback();
    });
}

async function AcceptFriendRequest(data, callback) {
    var con = mysql.createConnection({
        host: "localhost",
        user: "login",
        password: "",
        database: "messagecat"
      });

    con.connect(function(err) {
        if (err) throw err;
    });

    var requestExists = true;

    con.query("DELETE FROM `friend-requests` WHERE senderID like " + data.senderID + " and recipientID like " + data.recipientID, function (err, result, fields) {
        if (err) throw err;
        if (results.length == 0) {
            requestExists = false;
        }
    });

    if (requestExists) {
        con.query("INSERT INTO friends (userID, friend) values (" + data.senderID + ", " + data.recipientID + ")", function (err, result, fields) {
            if (err) throw err;
        });

        con.query("INSERT INTO friends (userID, friend) values (" + data.recipientID + ", " + data.senderID + ")", function (err, result, fields) {
            if (err) throw err;

            con.destroy();
            return callback();
        });
    }
}

async function GetFriendRequests(data, callback) {
    var con = mysql.createConnection({
        host: "localhost",
        user: "login",
        password: "",
        database: "messagecat"
      });

    con.connect(function(err) {
        if (err) throw err;
    });

    con.query("SELECT * FROM `friend-requests` WHERE recipientID like " + data.ID, function (err, result, fields) {
        //if (err) throw err;
        con.destroy();
        return callback(result);
    });
}

async function DeclineFriendRequest(data, callback) {
    var con = mysql.createConnection({
        host: "localhost",
        user: "login",
        password: "",
        database: "messagecat"
      });

    con.connect(function(err) {
        if (err) throw err;
    });

    con.query("DELETE FROM `friend-requests` WHERE senderID like " + data.senderID + " and recipientID like " + data.recipientID, function (err, result, fields) {
        if (err) throw err;
        return callback();
    });
}