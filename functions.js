var url = require("url");                // Include URL library for URL processing
var mysql = require("mysql");            // Include MySQL library for SQL handling
var fs  = require("fs");                 // Include fs library for file handling
var nodemailer = require("nodemailer");  // Include NodeMailer library for email handling


const mailTransporter = nodemailer.createTransport({  // Create a mail transporter, this connects to gmail and allows the server to send emails
    service: 'gmail',
    auth: {
        user: 'messagecatnotifications@gmail.com',
        pass: 'MessageThatCat1234**4321'
    }
});

// Define constants which will be used to check that the request method is allowed in a given context
const ALLOW_METHOD_GET  = "GET";
const ALLOW_METHOD_POST = "POST";

// Class used to define a method and its allowed request methods
class RequestFunction {
    constructor(f, methods_allowed, regex) {
        this.f = f;
        this.methods_allowed = methods_allowed;
        this.regex = regex;
    }
}

// The heartbeat buffer stores heartbeat messages from users which will be used to show whether or not the user is online
var heartbeatBuffer = [];

// Array that translates URI into a function that will process the request
URI_to_function = [
    new RequestFunction(getuserby_email, [ALLOW_METHOD_POST], /^\/api\/getuser\/email$/),
    new RequestFunction(getuserby_id, [ALLOW_METHOD_POST], /^\/api\/getuser\/id$/),
    new RequestFunction(getpfp, [ALLOW_METHOD_GET, ALLOW_METHOD_POST], /^\/api\/pfps/),
    new RequestFunction(createUser, [ALLOW_METHOD_POST], /^\/api\/createuser$/),
    new RequestFunction(getFriends, [ALLOW_METHOD_POST], /^\/api\/getfriends$/),
    new RequestFunction(SendMessage, [ALLOW_METHOD_POST], /^\/api\/sendmessage$/),
    new RequestFunction(GetMessages, [ALLOW_METHOD_POST], /^\/api\/getmessages$/),
    new RequestFunction(SendFriendRequest, [ALLOW_METHOD_POST], /^\/api\/sendfriendrequest$/),
    new RequestFunction(AcceptFriendRequest, [ALLOW_METHOD_POST], /^\/api\/acceptfriendrequest$/),
    new RequestFunction(GetFriendRequests, [ALLOW_METHOD_POST], /^\/api\/getfriendrequests$/),
    new RequestFunction(DeclineFriendRequest, [ALLOW_METHOD_POST], /^\/api\/declinefriendrequest$/),
    new RequestFunction(SearchForUser, [ALLOW_METHOD_POST], /^\/api\/searchforuser$/),
    new RequestFunction(GetUserSettings, [ALLOW_METHOD_POST], /^\/api\/getusersettings$/),
    new RequestFunction(ApplyUserSettings, [ALLOW_METHOD_POST], /^\/api\/applyusersettings$/),
    new RequestFunction(Heartbeat, [ALLOW_METHOD_POST], /^\/api\/heartbeat$/),
    new RequestFunction(GetUserActiveState, [ALLOW_METHOD_POST], /^\/api\/getuseractivestate$/)
];

// Function the processes and routes the initial request
// param 'req': The request to be processed
// param 'res': The response from the server
// param 'callback': The function to be called once processing is complete
function processRequest(req, res, callback) {
    // Parse the URI and get the relevant function from the array by testing the URI against the regular expressions defined for each function.
    let uri = url.parse(req.url).pathname;
    let requestFunction = undefined;
    for (let i = 0; i < URI_to_function.length; i++) {
        if (URI_to_function[i].regex.test(uri)) {
            requestFunction = URI_to_function[i];
            break;
        }
    }

    // Check that the URI is valid and the function exists
    if (requestFunction === undefined) {
        res.writeHead(200, {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "text/html"
        });
        
        res.write("<h1>Invalid URI</h1>");
        return callback();
    }

    // Check that the request method is allowed given the processor function's allowed methods
    if (!requestFunction.methods_allowed.includes(req.method)) {
        res.writeHead(200, {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "text/html"
        });
        
        res.write("<h1>Invalid method</h1>");
        return callback();
    }
    else {
        // Get the incoming data in the request's body
        let buffers = [];
        req.on("data", (chunk) => {
            buffers.push(chunk);
        });

        req.on("end", () => {
            let data = buffers.concat();
            requestFunction.f(data, uri, res, callback);
        });
    }
}

module.exports = { processRequest, PresenceManager };

// Query the SQL database
// param 'query': The query to be sent to the DB
// param 'callback': The function to be called once the request has been completed
async function sqlQuery(query, callback) {
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

    con.query(query, function (err, result, fields) {
        //if (err) throw err;
        con.destroy();
        return callback(result);
    });
}

// Manages user presence states using the heartbeats that are recieved
async function PresenceManager() {
    while (true) {
        await new Promise(resolve => setTimeout(resolve, 10000));
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
        
        sqlQuery(setInactiveQuery + "; " + setActiveQuery, (results) => {});
    }
}

// Send an email using mailTransporter
// param 'recipient': Recipient email
// param 'subject': Email subject line
// param 'content': Email HTML content
function SendEmail(recipient, subject, content) {
    let mail = {
        from: 'messagecatnotifications@gmail.com',
        to: recipient,
        subject: subject,
        html: content
    }

    mailTransporter.sendMail(mail, function(error, info) {});
}

// Request a user by email
// param 'data': The data found in the request's body
// param 'uri': The request URI
// param 'res': The response to be outputted to
// param 'callback': The function to call, once processing is complete
function getuserby_email(data, uri, res, callback) {
    data = JSON.parse(data);

    res.writeHead(200, {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json"
    });

    sqlQuery("SELECT * FROM users WHERE email like '" + data.email + "'", (results) => {
        if (results.length === 1) {
            res.write(JSON.stringify(results[0]));
            return callback();
        }
        else {
            res.write(JSON.stringify({"email": "", "password": ""}))
            return callback();
        }
    });
}

// Get a user by their ID
function getuserby_id(data, uri, res, callback) {
    data = JSON.parse(data);

    res.writeHead(200, {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json"
    });

    sqlQuery("SELECT * FROM users WHERE ID like '" + data.ID + "'", (results) => {
        if (results.length === 1) {
            res.write(JSON.stringify(results[0]));
            return callback();
        }
        else {
            res.write(JSON.stringify({"ID": "", "password": ""}))
            return callback();
        }
    });
}

// Get a user's pfp
function getpfp(data, uri, res, callback) {
    res.writeHead(200, {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "image/png"
    });

    let split_path = uri.split("/");
    let pfp_path = "./pfps/" + split_path[split_path.length - 1];

    let stream = fs.createReadStream(pfp_path);
    stream.on("open", () => {
        stream.pipe(res);
    });
    
    // Do not call callback, because it will end the response pipe, so the image will not be served.
    //return callback();
}

// Create a new user
function createUser(data, uri, res, callback) {
    res.writeHead(200, {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json"
    });

    data = JSON.parse(data);
    // Format the data to make it safe to use in SQL statements
    data.username = data.username.replaceAll("'", "''");
    data.email = data.email.replaceAll("'", "''");

    // Check that the user does not already exist
    sqlQuery("SELECT * FROM users WHERE email like '" + data.email + "'", (results) => {
        if (results.length == 0) {
            // Create the new user
            sqlQuery("INSERT INTO users (username, password, email) values ('" + data.username + "', '" + data.password + "', '" + data.email + "'); INSERT INTO `user-settings` (userID) SELECT ID FROM users WHERE email like '" + data.email + "'; INSERT INTO `user-active-states` (userID, active) SELECT ID, 0 FROM users WHERE email like '" + data.email + "';", (results) => {
                // Get the new user and return the data
                sqlQuery("SELECT * FROM users WHERE email like '" + data.email + "'", (results) => {
                    res.write(JSON.stringify(results[0]));
                    return callback();
                });
            });
        }
        else {
            return callback();
        }
    });
}

// Get a list of the user's friends
function getFriends(data, uri, res, callback) {
    res.writeHead(200, {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "text/plain"
    });

    data = JSON.parse(data);

    sqlQuery("SELECT * FROM friends WHERE userID like " + data.ID, (friendRecords) => {
        if (friendRecords === undefined) {
            res.write("");
            return callback();
        }

        if (friendRecords.length == 0) {
            res.write("");
            return callback();
        }

        let friendsData = [];
        for (let i = 0; i < friendRecords.length; i++) {
            sqlQuery("SELECT * FROM users WHERE id like " + JSON.parse(JSON.stringify(friendRecords[i])).friend, (results) => {
                friendsData.push(JSON.stringify(results[0]));

                if (friendRecords.length == friendsData.length) {
                    res.write(friendsData.join("<[SePaRaToR]>"));
                    return callback();
                }
            });
        }
    });
}

// Send a message to a user
function SendMessage(data, uri, res, callback) {
    res.writeHead(200, {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "text/plain"
    });

    data = JSON.parse(data);
    data.content = data.content.replaceAll("'", "''");

    sqlQuery("INSERT INTO messages (senderID, recipientID, content) values (" + data.senderID + ", " + data.recipientID + ", '" + data.content + "')", (results) => {
        res.write("OK");
    });

    // Send email to recipient
    sqlQuery("SELECT * FROM `user-settings` WHERE userID like " + data.recipientID, (results) => {
        if (results === undefined) {
            res.write("");
            return callback();
        }

        if (JSON.parse(JSON.stringify(results[0])).send_email_notifications == "1") {
            sqlQuery("SELECT * FROM users WHERE ID like " + data.senderID, (senderResult) => {
                let senderData = JSON.parse(JSON.stringify(senderResult[0]));
        
                sqlQuery("SELECT * FROM users WHERE ID like " + data.recipientID, (recipientResult) => {
                    let recipientData = JSON.parse(JSON.stringify(recipientResult[0]));
        
                    SendEmail(
                        recipientData.email,
                        senderData.username + " sent you a message",
                        senderData.username + " said \"" + data.content.replaceAll("''", "'") + "\""
                    );
        
                    return callback();
                });
            });
        }
        else {
            return callback();
        }
    });
    
}

// Get all messages between two users
function GetMessages(data, uri, res, callback) {
    res.writeHead(200, {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "text/plain"
    });

    data = JSON.parse(data);

    sqlQuery("SELECT * FROM messages WHERE (senderID like " + data.userID + " and recipientID like " + data.friendID + ") or (senderID like " + data.friendID + " and recipientID like " + data.userID + ")", (results) => {
        if (results === undefined) {
            res.write("");
            return callback();
        }
        
        let JSONStrings = results.map((item) => {
            return JSON.stringify(item);
        });

        res.write(JSONStrings.join("<[SePaRaToR]>"));
        return callback();
    });
}

// Send a friend request to a user
function SendFriendRequest(data, uri, res, callback) {
    res.writeHead(200, {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "text/plain"
    });

    data = JSON.parse(data);

    sqlQuery("INSERT INTO `friend-requests` (senderID, recipientID) values (" + data.senderID + ", " + data.recipientID + "); SELECT * FROM `user-settings` WHERE userID like " + data.recipientID + ";", (results) => {
        res.write("OK");

        if (JSON.parse(JSON.stringify(results[1][0])).send_email_notifications == "1") {
            sqlQuery("SELECT * FROM users WHERE ID like " + data.senderID, (senderResults) => {
                sqlQuery("SELECT * FROM users WHERE ID like " + data.recipientID, (recipientResults) => {
                    let senderData = JSON.parse(JSON.stringify(senderResults[0]));
                    let recipientData = JSON.parse(JSON.stringify(recipientResults[0]));
    
                    SendEmail(
                        recipientData.email,
                        senderData.username + " sent you a friend request",
                        senderData.username + " sent you a friend request."
                    );

                    return callback();
                });
            });
        }
        else {
            return callback();
        }
    });
}

// Accept a friend request
function AcceptFriendRequest(data, uri, res, callback) {
    res.writeHead(200, {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "text/plain"
    });

    data = JSON.parse(data);

    let requestExists = true;
    sqlQuery("DELETE FROM `friend-requests` WHERE senderID like " + data.senderID + " and recipientID like " + data.recipientID, (results) => {
        if (results === undefined) {
            requestExists = false;
        }

        if (results.length === 0) {
            requestExists = false;
        }
    });

    if (requestExists) {
        sqlQuery("INSERT INTO friends (userID, friend) values (" + data.senderID + ", " + data.recipientID + ")", (results) => {
            sqlQuery("INSERT INTO friends (userID, friend) values (" + data.recipientID + ", " + data.senderID + ")", (results) => {
                res.write("OK");
                return callback();
            });
        });
    }
}

// Get friend requests
function GetFriendRequests(data, uri, res, callback) {
    res.writeHead(200, {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "text/plain"
    });

    data = JSON.parse(data);

    sqlQuery("SELECT * FROM `friend-requests` WHERE recipientID like " + data.ID, (results) => {
        let JSONStrings = results.map((item) => {
            return JSON.stringify(item);
        });

        res.write(JSONStrings.join("<[SePaRaToR]>"));
        return callback();
    });
}

// Decline a friend request
function DeclineFriendRequest(data, uri, res, callback) {
    res.writeHead(200, {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "text/plain"
    });

    data = JSON.parse(data);

    sqlQuery("DELETE FROM `friend-requests` WHERE senderID like " + data.senderID + " and recipientID like " + data.recipientID, (results) => {
        res.write("OK");
        return callback();
    });
}

// Search for a user
function SearchForUser(data, uri, res, callback) {
    res.writeHead(200, {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "text/plain"
    });

    data = JSON.parse(data);

    sqlQuery("SELECT * FROM users WHERE username like '" + data.username + "'", (results) => {
        let JSONStrings = results.map((item) => {
            return JSON.stringify(item);
        });

        res.write(JSONStrings.join("<[SePaRaToR]>"));
        return callback();
    });
}

// Get a user's settings
function GetUserSettings(data, uri, res, callback) {
    res.writeHead(200, {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json"
    });

    data = JSON.parse(data);

    sqlQuery("SELECT * FROM `user-settings` WHERE userID like " + data.ID, (results) => {
        if (results === undefined) {
            return callback();
        }

        res.write(JSON.stringify(results[0]));
        return callback();
    });
}

// Apply a user's new settings
function ApplyUserSettings(data, uri, res, callback) {
    res.writeHead(200, {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "text/plain"
    });

    data = JSON.parse(data);

    sqlQuery("DELETE FROM `user-settings` WHERE userID like " + data.ID, (results) => {
        sqlQuery("INSERT INTO `user-settings` (userID, send_email_notifications) values (" + data.ID + ", " + data.send_email_notifications + ")", (results) => {
            res.write("OK");
            return callback();
        });
    });
}

// Recieve a heartbeat from a user
function Heartbeat(data, uri, res, callback) {
    res.writeHead(200, {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "text/plain"
    });

    heartbeatBuffer.push(JSON.parse(data));
    res.write("OK");
    return callback();
}

// Get a user's active state
function GetUserActiveState(data, uri, res, callback) {
    res.writeHead(200, {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json"
    });

    data = JSON.parse(data);

    sqlQuery("SELECT * FROM `user-active-states` WHERE userID like " + data.ID, (results) => {
        res.write(JSON.stringify(results[0]));
        return callback();
    });
}