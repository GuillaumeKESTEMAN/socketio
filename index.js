const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const fs = require('fs');
let users = [];
let pseudos = [];                                                           //tableau contenant tous les pseudos des participants
let guestIndex = [];                                                        //tableau disant si l'emplacement x d'invité est pris

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

function verifSupZ(number){
    if(number < 10){
        return "0"+number;
    } else{
        return number;
    }
}

io.on('connection', (socket) => {
    socket.emit('pseudoRequired', pseudos, guestIndex);
    let ip = socket.handshake.address;
    ip = ip.substring(7);
    const token = (parseInt(Math.random().toString().substring(2)) * parseInt(Math.random().toString().substring(2))).toString().substring(2,18);
    fs.readFile("logs.txt", "utf8", function (err, readData){
        let content = `${verifSupZ(new Date().getDate())}/${verifSupZ(new Date().getMonth())}/${new Date().getFullYear()} ${verifSupZ(new Date().getHours())}:${verifSupZ(new Date().getMinutes())}:${verifSupZ(new Date().getSeconds())} -- incoming user     | ip : "${ip}" / id : "${socket.id}"`;
        let data;
        if(!isNaN(readData.charCodeAt(0))){
            data = readData + "\n" + content;
        } else{
            data = content;
        }
        fs.writeFile('logs.txt', data, error => {
            if(error) {
                console.error("error : "+ error);
            }
        });
        console.log(content);
    });
    socket.on('pseudo', (pseudo, newGuestIndex) => {
        socket.emit('token', token);
        guestIndex = newGuestIndex;
        pseudos.push(pseudo);
        users[token] = {pseudo: pseudo, id: socket.id, ip: ip};
        fs.readFile("logs.txt", "utf8", function (err, readData){
            let content;
            try{
                content = `${verifSupZ(new Date().getDate())}/${verifSupZ(new Date().getMonth())}/${new Date().getFullYear()} ${verifSupZ(new Date().getHours())}:${verifSupZ(new Date().getMinutes())}:${verifSupZ(new Date().getSeconds())} -- user connected    | ip : "${users[token].ip}" / id : "${users[token].id}" / token : "${token}" / pseudo : "${users[token].pseudo}"`;
            } catch (e) {
                content = `${verifSupZ(new Date().getDate())}/${verifSupZ(new Date().getMonth())}/${new Date().getFullYear()} ${verifSupZ(new Date().getHours())}:${verifSupZ(new Date().getMinutes())}:${verifSupZ(new Date().getSeconds())} -- user connected    | ip : "ERR" / id : "ERR" / token : "ERR" / pseudo : "ERR"`;
            }
            let data;
            if(!isNaN(readData.charCodeAt(0))){
                data = readData + "\n" + content;
            } else{
                data = content;
            }
            fs.writeFile('logs.txt', data, error => {
                if(error) {
                    console.error("error : "+ error);
                }
            });
            console.log(content);
        });
        socket.emit('users', pseudos);
        fs.readFile("messages.txt", "utf8", function (err, readData){
            if(!isNaN(readData.charCodeAt(0))){
                let data = readData.split('\n');
                for (let i = 0; i < data.length; i++) {
                    socket.emit('logs',JSON.parse(data[i]));
                    socket.emit('chat message', `${JSON.parse(data[i]).user} : ${JSON.parse(data[i]).message}`);
                }
            }
        });
        socket.broadcast.emit('newUser', users[token].pseudo);
    });
    socket.on('chat message', (msg, token) => {
        fs.readFile("logs.txt", "utf8", function (err, readData){
            let content = `${verifSupZ(new Date().getDate())}/${verifSupZ(new Date().getMonth())}/${new Date().getFullYear()} ${verifSupZ(new Date().getHours())}:${verifSupZ(new Date().getMinutes())}:${verifSupZ(new Date().getSeconds())} -- (${users[token].ip}) / ${users[token].pseudo} : ${msg}`;
            let data;
            if(!isNaN(readData.charCodeAt(0))){
                data = readData + "\n" + content;
            } else{
                data = content;
            }
            fs.writeFile('logs.txt', data, error => {
                if(error) {
                    console.error("error : "+ error);
                }
            });
            console.log(content);
        });
        fs.readFile("messages.txt", "utf8", function (err, readData){
            let content = {user: `${users[token].pseudo}`, message: `${msg}`};
            content = JSON.stringify(content);
            let data;
            if(!isNaN(readData.charCodeAt(0))){
                data = readData + "\n" + content;
            } else{
                data = content;
            }
            fs.writeFile('messages.txt', data, error => {
                if(error) {
                    console.error("error : "+ error);
                }
            });
        });
    });
    socket.on('disconnect', () => {
        fs.readFile("logs.txt", "utf8", function (err, readData){
            let content;
            try{
                content = `${verifSupZ(new Date().getDate())}/${verifSupZ(new Date().getMonth())}/${new Date().getFullYear()} ${verifSupZ(new Date().getHours())}:${verifSupZ(new Date().getMinutes())}:${verifSupZ(new Date().getSeconds())} -- user disconnected | ip : "${users[token].ip}" / id : "${users[token].id}" / token : "${token}" / pseudo : "${users[token].pseudo}"`;
            } catch (e){
                content = `${verifSupZ(new Date().getDate())}/${verifSupZ(new Date().getMonth())}/${new Date().getFullYear()} ${verifSupZ(new Date().getHours())}:${verifSupZ(new Date().getMinutes())}:${verifSupZ(new Date().getSeconds())} -- user disconnected | ip : "ERR" / id : "$ERR" / token : "${token}" / pseudo : "ERR"`;
            }
            let data;
            if(!isNaN(readData.charCodeAt(0))){
                data = readData + "\n" + content;
            } else{
                data = content;
            }
            fs.writeFile('logs.txt', data, error => {
                if(error) {
                    console.error("error : "+ error);
                }
            });
            console.log(content);
            if(pseudos.length > 1){
                socket.broadcast.emit('userLeft', users[token].pseudo);
            }
            for (let i = 0; i < pseudos.length; i++) {
                if(pseudos[i] === users[token].pseudo){
                    if(pseudos.length > 1){
                        for (let j = i; j < pseudos.length-1; j++) {
                            pseudos[j] = pseudos[j+1];
                        }
                        pseudos = pseudos.slice(0,pseudos.length-1);
                    } else{
                        pseudos = pseudos.slice(pseudos.length);
                    }
                    break;
                }
            }
            if(users[token].pseudo.substring(0,7) === "Invité_"){
                guestIndex[users[token].pseudo.substring(7) - 1] = undefined;
            }
            delete users[token];
            if(pseudos.length === 0){
                fs.truncate('logs.txt', 0, function(){});
                fs.truncate('messages.txt', 0, function(){console.log('LOGS CLEARED !')});
            }
        });
    });
});

io.on('connection', (socket) => {
    socket.on('chat message', (msg, token) => {
        io.emit('chat message', `${users[token].pseudo} : ${msg}`);
    });
});

io.emit('some event', { someProperty: 'some value', otherProperty: 'other value' }); // This will emit the event to all connected sockets

http.listen(3000, () => {
    console.log(`listening on port : 3000`);
});