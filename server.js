const { Server } = require('socket.io');
const express = require('express');
const http = require('http');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

let chatHistory = [];

app.use(express.static(__dirname));

io.on ('connection', (socket) => {
    socket.on('join', (data) => {
        socket.username = data.username;
        console.log(data.username + ' joined the chat');
        io.emit('chat message', { username: 'System', content: data.username + ' has joined the chat' });
        
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
        io.emit('chat message', { username: 'System', content: socket.username + ' has left the chat' });
    });
});

server.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});
