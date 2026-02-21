const { Server } = require('socket.io');
const express = require('express');
const http = require('http');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

let chatHistory = [];
let onlineUsers = {};

app.use(express.static(__dirname));

io.on ('connection', (socket) => {
    socket.on('join', (data) => {
        socket.username = data.username;
        onlineUsers[socket.id] = socket.username;

        console.log(data.username + ' joined the chat');
        io.emit('chat message', { username: 'System', content: data.username + ' has joined the chat' });
        io.emit('user list', Object.values(onlineUsers));
        
        const filteredHistory = chatHistory.filter(msg => msg.timestamp >= data.firstJoined);
        socket.emit('chat history', filteredHistory);
    });

    socket.on('chat message', (msg) => {
        msg.timestamp = Date.now();
        chatHistory.push(msg);
        io.emit('chat message', msg);
    });

    socket.on('disconnect', () => {
        console.log(socket.username + ' disconnected');
        delete onlineUsers[socket.id];
        io.emit('user list', Object.values(onlineUsers));
        io.emit('chat message', { username: 'System', content: socket.username + ' has left the chat' });
    });
});

server.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});
