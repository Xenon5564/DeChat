const { Server } = require('socket.io');
const express = require('express');
const http = require('http');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname));

io.on ('connection', (socket) => {
    socket.on('join', (username) => {
        console.log(username + ' joined the chat');
        io.emit('chat message', { username: 'System', content: username + ' has joined the chat' });
    });

    socket.on('chat message', (msg) => {
        console.log('message: ' + msg.username + ': ' + msg.content);
        io.emit('chat message', msg);
    });
});

server.listen(3000, () => {
    console.log('listening on localhost:3000');
});