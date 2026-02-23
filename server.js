const { Server } = require('socket.io');
const express = require('express');
const https = require('https');
const fs = require('fs');
const app = express();

const options = {
    key: fs.readFileSync('key.pem'),
    cert: fs.readFileSync('cert.pem')
};

const server = https.createServer(options, app);
const io = new Server(server);

let chatHistory = [];
let onlineUsers = {};

app.use(express.static(__dirname));

function generateTag(keyString) {
    if(!keyString) return '0000';
     
    let hash = 0;
    for (let i = 0; i < keyString.length; i++) {
        hash = (hash << 5) - hash + keyString.charCodeAt(i);
        hash |= 0; // Convert to 32bit integer
    }

    return Math.abs(hash).toString(16).substring(0, 4).toUpperCase();
}

io.on ('connection', (socket) => {
    socket.on('join', (data) => {
        const activeUsers = Object.values(onlineUsers);
        const isAccountOnline = activeUsers.find(user => user.publicKey === data.publicKey);
        if (isAccountOnline) {
            socket.emit('join error', 'You are already connected to this server!');
            return;
        } 

        const userTag = generateTag(data.publicKey);
        socket.username = data.username;
        socket.tag = userTag;
        socket.publicKey = data.publicKey;
        onlineUsers[socket.id] = {
            username: socket.username,
            tag: socket.tag,
            publicKey: socket.publicKey
        };

        socket.emit('join success');

        console.log(`${socket.username}#${socket.tag} joined the chat`);
        const connectMessage = { 
            username: 'System', 
            content: `${socket.username}#${socket.tag} has joined the chat` 
        };
        chatHistory.push(connectMessage);
        
        io.emit('chat message', connectMessage);
        io.emit('user list', Object.values(onlineUsers));
        
        const filteredHistory = chatHistory.filter(msg => msg.timestamp >= data.firstJoined);
        socket.emit('chat history', filteredHistory);
    });

    socket.on('chat message', (msg) => {
        const fullHandle = `${socket.username}#${socket.tag}`;
        msg.username = fullHandle;
        msg.timestamp = Date.now();
        chatHistory.push(msg);
        io.emit('chat message', msg);
    });

    socket.on('disconnect', () => {
        if (socket.username) {
            console.log(`${socket.username}#${socket.tag} disconnected`);
    
            delete onlineUsers[socket.id];
            io.emit('user list', Object.values(onlineUsers));

            const disconnectMessage = { 
                username: 'System', 
                content: `${socket.username}#${socket.tag} has left the chat` 
            };
            chatHistory.push(disconnectMessage);
            io.emit('chat message', disconnectMessage);
        }
    });
});

server.listen(3000, () => {
    console.log('Server is running on https://localhost:3000');
});
