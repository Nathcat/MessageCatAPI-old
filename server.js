var http = require("http");
var url = require("url");
var mysql = require("mysql");
var fs = require("fs");
var nodemailer = require("nodemailer");

const mailTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'messagecatnotifications@gmail.com',
        pass: 'MessageThatCat1234**4321'
    }
});

var heartbeatBuffer = [];
PresenceManager();

http.createServer(function (req, res) {
    // Parse the URL to check the requested action
    var path = url.parse(req.url, true).pathname;

    if (path === "/api/getuser") {  // Get user data from SQL database
        if (req.method == "GET") {
            res.writeHead(200, {
                "Access-Control-Allow-Origin": "*",
                "Content-Type": "text/html"
            });
    
            return res.end("<h1>Invalid method</h1>");
        }

        res.writeHead(200, {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "application/json"
        });

        GetUser(req, (users) => {
            if (users === undefined) {
                return res.end("");
            }
            
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
    
            return res.end("<h1>Invalid method</h1>");
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
    
            return res.end("<h1>Invalid method</h1>");
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
                if (friendRecords === undefined) {
                    return res.end("");
                }

                if (friendRecords.length == 0) {
                    return res.end("");
                }

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
    
            return res.end("<h1>Invalid method</h1>");
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
    
            return res.end("<h1>Invalid method</h1>");
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
    
            return res.end("<h1>Invalid method</h1>");
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
    
            return res.end("<h1>Invalid method</h1>");
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
    
            return res.end("<h1>Invalid method</h1>");
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
                if (result) {
                    return res.end(
                        result.map((item) => {
                            return JSON.stringify(item);
                        }).join("<[SePaRaToR]>")
                    );
                }
                else {
                    return res.end("");
                }
            });
        });
    }
    else if (path === "/api/declinefriendrequest") {
        if (req.method == "GET") {
            res.writeHead(200, {
                "Access-Control-Allow-Origin": "*",
                "Content-Type": "text/html"
            });
    
            return res.end("<h1>Invalid method</h1>");
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
    else if (path === "/api/searchforuser") {
        if (req.method == "GET") {
            res.writeHead(200, {
                "Access-Control-Allow-Origin": "*",
                "Content-Type": "text/html"
            });
    
            return res.end("<h1>Invalid method</h1>");
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

            SearchForUser(data, (results) => {
                return res.end(
                    results.map((item) => {
                        return JSON.stringify(item);
                    }).join("<[SePaRaToR]>")
                );
            });
        });
    }
    else if (path === "/api/getuser/id") {
        if (req.method == "GET") {
            res.writeHead(200, {
                "Access-Control-Allow-Origin": "*",
                "Content-Type": "text/html"
            });
    
            return res.end("<h1>Invalid method</h1>");
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
            let data = JSON.parse(buffers.concat());

            RequestUserByID(data.ID, (results) => {
                if (results.length == 1) {
                    return res.end(JSON.stringify(results[0]));
                }
                else {
                    return res.end({});
                }
            })
        })
    }
    else if (path === "/api/getusersettings") {
        if (req.method == "GET") {
            res.writeHead(200, {
                "Access-Control-Allow-Origin": "*",
                "Content-Type": "text/html"
            });
    
            return res.end("<h1>Invalid method</h1>");
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
            let data = JSON.parse(buffers.concat());
            GetUserSettings(data, (results) => {
                if (results.length == 1) {
                    return res.end(JSON.stringify(results[0]));
                }
                else {
                    return res.end("");
                }
            })
        })
    }
    else if (path === "/api/applyusersettings") {
        if (req.method == "GET") {
            res.writeHead(200, {
                "Access-Control-Allow-Origin": "*",
                "Content-Type": "text/html"
            });
    
            return res.end("<h1>Invalid method</h1>");
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
            ApplyUserSettings(data, () => {
                return res.end("OK");
            })
        })
    }
    else if (path === "/api/heartbeat") {
        if (req.method == "GET") {
            res.writeHead(200, {
                "Access-Control-Allow-Origin": "*",
                "Content-Type": "text/html"
            });
    
            return res.end("<h1>Invalid method</h1>");
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
            heartbeatBuffer.push(data);
            return res.end("OK");
        });
    }
    else if (path === "/api/getuseractivestate") {
        if (req.method == "GET") {
            res.writeHead(200, {
                "Access-Control-Allow-Origin": "*",
                "Content-Type": "text/html"
            });
    
            return res.end("<h1>Invalid method</h1>");
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
            let data = JSON.parse(buffers.concat());
            GetUserActiveState(data, (result) => {
                if (result === undefined) {
                    return res.end("");
                }

                if (result.length == 1) {
                    return res.end(JSON.stringify(result[0]));
                }
                else {
                    return res.end("");
                }
            })
        });
    }

}).listen(8080);

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
        //if (err) throw err;
    });

    con.query("SELECT * FROM users WHERE email like '" + email + "'", function (err, result, fields) {
        //if (err) throw err;
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
        //if (err) throw err;
    });

    con.query("SELECT * FROM users WHERE ID like " + id + " order by ID asc", async (err, result, fields) => {
        //if (err) throw err;
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
                database: "messagecat",
                multipleStatements: true
            });
        
            con.connect(function(err) {
                //if (err) throw err;
            });
        
            con.query("INSERT INTO users (username, password, email) values ('" + data.username + "', '" + data.password + "', '" + data.email + "'); INSERT INTO `user-settings` (userID) SELECT ID FROM users WHERE email like '" + data.email + "'; INSERT INTO `user-active-states` (userID, active) SELECT ID, 0 FROM users WHERE email like '" + data.email + "';", function (err, result, fields) {
                //if (err) throw err;
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
        //if (err) throw err;
    });

    con.query("SELECT * FROM friends WHERE userID like " + userID + "", function (err, result, fields) {
        //if (err) throw err;
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
        //if (err) throw err;
    });

    con.query("INSERT INTO messages (senderID, recipientID, content) values (" + messageJson.senderID +  ", " + messageJson.recipientID + ", '" + messageJson.content + "')", function (err, result, fields) {
        //if (err) throw err;
        con.destroy();
        return callback();
    });

    GetUserSettings({ID: messageJson.recipientID}, (results) => {
        let data = JSON.parse(JSON.stringify(results[0]));
        if (data.send_email_notifications == "1") {
            RequestUserByID(messageJson.recipientID, (users) => {
                let recipientData = JSON.parse(JSON.stringify(users[0]));

                RequestUserByID(messageJson.senderID, (sender) => {
                    let senderData = JSON.parse(JSON.stringify(sender[0]));

                    let mail = {
                        from: 'messagecatnotifications@gmail.com',
                        to: recipientData.email,
                        subject: senderData.username + " sent you a message",
                        html: senderData.username + " said '" + messageJson.content + "'."
                    }

                    mailTransporter.sendMail(mail, function(error, info) {});
                })
            })
        }
    })
}

async function GetMessages(data, callback) {
    var con = mysql.createConnection({
        host: "localhost",
        user: "login",
        password: "",
        database: "messagecat"
      });

    con.connect(function(err) {
        //if (err) throw err;
    });

    con.query("SELECT * FROM messages WHERE (senderID like " + data.userID + " and recipientID like " + data.friendID + ") or (senderID like " + data.friendID + " and recipientID like " + data.userID + ")", function (err, result, fields) {
        ////if (err) throw err;
        con.destroy();
        return callback(result);
    });
}

async function SendFriendRequest(data, callback) {
    var con = mysql.createConnection({
        host: "localhost",
        user: "login",
        password: "",
        database: "messagecat",
        multipleStatements: true
      });

    con.connect(function(err) {
        //if (err) throw err;
    });

    con.query("INSERT INTO `friend-requests` (senderID, recipientID) values (" + data.senderID + ", " + data.recipientID + "); SELECT * FROM `user-settings` WHERE userID like " + data.recipientID + ";", function (err, result, fields) {
        //if (err) throw err;
        con.destroy();

        if (JSON.parse(JSON.stringify(result[1][0])).send_email_notifications === 1) {
            RequestUserByID(data.recipientID, (users) => {
                let recipientData = JSON.parse(JSON.stringify(users[0]));

                RequestUserByID(data.senderID, (sender) => {
                    let senderData = JSON.parse(JSON.stringify(sender[0]));

                    let mail = {
                        from: 'messagecatnotifications@gmail.com',
                        to: recipientData.email,
                        subject: senderData.username + " sent you a friend request",
                        html: senderData.username + " sent you a friend request."
                    }

                    mailTransporter.sendMail(mail, function(error, info) {});
                })
            })
        }

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
        //if (err) throw err;
    });

    var requestExists = true;

    con.query("DELETE FROM `friend-requests` WHERE senderID like " + data.senderID + " and recipientID like " + data.recipientID, function (err, result, fields) {
        //if (err) throw err;
        if (result.length == 0) {
            requestExists = false;
        }
    });

    if (requestExists) {
        con.query("INSERT INTO friends (userID, friend) values (" + data.senderID + ", " + data.recipientID + ")", function (err, result, fields) {
            //if (err) throw err;
        });

        con.query("INSERT INTO friends (userID, friend) values (" + data.recipientID + ", " + data.senderID + ")", function (err, result, fields) {
            //if (err) throw err;

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
        //if (err) throw err;
    });

    con.query("SELECT * FROM `friend-requests` WHERE recipientID like " + data.ID, function (err, result, fields) {
        ////if (err) throw err;
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
        //if (err) throw err;
    });

    con.query("DELETE FROM `friend-requests` WHERE senderID like " + data.senderID + " and recipientID like " + data.recipientID, function (err, result, fields) {
        //if (err) throw err;
        con.destroy();
        return callback();
    });
}

async function SearchForUser(data, callback) {
    var con = mysql.createConnection({
        host: "localhost",
        user: "login",
        password: "",
        database: "messagecat"
      });

    con.connect(function(err) {
        //if (err) throw err;
    });

    con.query("SELECT * FROM users WHERE username like '" + data.username + "'", function (err, result, fields) {
        //if (err) throw err;
        con.destroy();
        return callback(result);
    });
}

async function GetUserSettings(data, callback) {
    var con = mysql.createConnection({
        host: "localhost",
        user: "login",
        password: "",
        database: "messagecat"
      });

    con.connect(function(err) {
        //if (err) throw err;
    });

    con.query("SELECT * FROM `user-settings` WHERE userID like '" + data.ID + "'", function (err, result, fields) {
        //if (err) throw err;
        con.destroy();
        return callback(result);
    });
}

async function ApplyUserSettings(data, callback) {
    var con = mysql.createConnection({
        host: "localhost",
        user: "login",
        password: "",
        database: "messagecat"
      });

    con.connect(function(err) {
        //if (err) throw err;
    });

    con.query("DELETE FROM `user-settings` WHERE userID like " + data.ID, function (err, result, fields) {
        //if (err) throw err;
    });

    con.query("INSERT INTO `user-settings` (userID, send_email_notifications) values (" + data.ID + ", " + data.send_email_notifications + ")", function (err, result, fields) {
        //if (err) throw err;
        return callback();
    });
}

async function PresenceManager() {
    while (true) {
        await new Promise(resolve => setTimeout(resolve, 10000));

        var con = mysql.createConnection({
            host: "localhost",
            user: "login",
            password: "",
            database: "messagecat",
            multipleStatements: true
        });

        con.connect(function(err) {
            //if (err) throw err;
        });

        let setActiveQuery = "UPDATE `user-active-states` SET active = 1 WHERE ";

        for (let i = 0; i < heartbeatBuffer.length; i++) {
            let newCondition = "";
            if (i != 0) {
                newCondition += " or ";
            }

            newCondition += "userID like " + heartbeatBuffer[i].ID;
            setActiveQuery += newCondition;
        }

        let setInactiveQuery = "UPDATE `user-active-states` SET active = 0 WHERE ";
    
        for (let i = 0; i < heartbeatBuffer.length; i++) {
            let newCondition = "";
            if (i != 0) {
                newCondition += " and ";
            }

            newCondition += "userID not like " + heartbeatBuffer[i].ID;
            setInactiveQuery += newCondition;
        }

        heartbeatBuffer = [];
        
        con.query(setInactiveQuery + "; " + setActiveQuery, function (err, result, fields) {
            con.destroy();
        });
    }
}

async function GetUserActiveState(data, callback) {
    var con = mysql.createConnection({
        host: "localhost",
        user: "login",
        password: "",
        database: "messagecat",
    });

    con.connect(function (err) {
        //if (err) throw err;
    });

    con.query("SELECT * FROM `user-active-states` WHERE userID like " + data.ID, function (err, result, fields) {
        //if (err) throw err;
        con.destroy();
        return callback(result);
    });
}