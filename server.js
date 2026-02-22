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
        if(Object.values(onlineUsers).includes(data.username)) {
            socket.emit('join error', 'Username already taken');
            return;
        } else{
            socket.username = data.username;
            onlineUsers[socket.id] = socket.username;

            socket.emit('join success');

            console.log(data.username + ' joined the chat');
            const connectMessage = { username: 'System', content: data.username + ' has joined the chat' };
            chatHistory.push(connectMessage);
            io.emit('chat message', connectMessage);
            io.emit('user list', Object.values(onlineUsers));
            
            const filteredHistory = chatHistory.filter(msg => msg.timestamp >= data.firstJoined);
            socket.emit('chat history', filteredHistory);
        }
    });

    socket.on('chat message', (msg) => {
        msg.timestamp = Date.now();
        chatHistory.push(msg);
        io.emit('chat message', msg);
    });

        socket.on('disconnect', () => {
            if(socket.username !== undefined) {
                console.log(socket.username + ' disconnected');
                delete onlineUsers[socket.id];
                io.emit('user list', Object.values(onlineUsers));
                const disconnectMessage = { username: 'System', content: socket.username + ' has left the chat' };
                chatHistory.push(disconnectMessage);
                io.emit('chat message', disconnectMessage);
            }
        });
});

server.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});
