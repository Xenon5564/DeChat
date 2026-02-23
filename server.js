const { Server } = require('socket.io');
const express = require('express');
const https = require('https');
const fs = require('fs');
const { send } = require('process');
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

const commands = {
    'direct': (socket, args) => {
        const senderHandle = `${socket.username}#${socket.tag}`;
        const targetHandle = args[0];

        if (!targetHandle) {
            socket.emit('chat message', { username: 'System', content: 'Usage: /Direct <username#tag>' });
            return;
        }

        if (targetHandle === senderHandle) {
            socket.emit('chat message', { username: 'System', content: 'You cannot DM yourself!' });
            return;
        }

        const targetSocketId = getSocketIdByHandle(targetHandle);
        if (targetSocketId) {

            console.log('DM Request:', senderHandle, '->', targetHandle);

             io.to(targetSocketId).emit('dm request', { 
                from: senderHandle, 
                publicKey: socket.publicKey
            });

            socket.emit('chat message', { username: 'System', content: `DM request sent to ${targetHandle}` });
        } else {
            socket.emit('chat message', { username: 'System', content: `User ${targetHandle} not found` });
        }
    }
}

function generateTag(keyString) {
    if(!keyString) return '0000';
     
    let hash = 0;
    for (let i = 0; i < keyString.length; i++) {
        hash = (hash << 5) - hash + keyString.charCodeAt(i);
        hash |= 0; // Convert to 32bit integer
    }

    return Math.abs(hash).toString(16).substring(0, 4).toUpperCase();
}
function getSocketIdByHandle(handle) {
    const sockets = Object.keys(onlineUsers);
    for (let socketID of sockets) {
        const user = onlineUsers[socketID];
        const userHandle = `${user.username}#${user.tag}`;
        if (userHandle === handle) {
            return socketID;
        }
    }
    return null;
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
            timestamp: Date.now(),
            content: `${socket.username}#${socket.tag} has joined the chat` 
        };
        chatHistory.push(connectMessage);
        
        io.emit('chat message', connectMessage);
        io.emit('user list', Object.values(onlineUsers));
        
        const filteredHistory = chatHistory.filter(msg => msg.timestamp >= data.firstJoined);
        socket.emit('chat history', filteredHistory);
    });
    socket.on('chat message', (msg) => {
        if (msg.content.startsWith('/')) {
            const args = msg.content.slice(1).trim().split(' ');
            const command = args.shift();

            if (commands[command]) {
                commands[command](socket, args);
            } else {
                socket.emit('chat message', { username: 'System', content: `Unknown command: ${command}` });
            }
        } else {
            msg.timestamp = Date.now();
            const fullHandle = `${socket.username}#${socket.tag}`;
            msg.username = fullHandle;
            chatHistory.push(msg);
            io.emit('chat message', msg);
        }
    });
    socket.on('disconnect', () => {
        if (socket.username) {
            console.log(`${socket.username}#${socket.tag} disconnected`);
    
            delete onlineUsers[socket.id];
            io.emit('user list', Object.values(onlineUsers));

            const disconnectMessage = { 
                username: 'System', 
                timestamp: Date.now(),
                content: `${socket.username}#${socket.tag} has left the chat` 
            };
            chatHistory.push(disconnectMessage);
            io.emit('chat message', disconnectMessage);
        }
    });
    socket.on('dm response', (data) => {
        const targetSocketId = getSocketIdByHandle(data.to);
        const senderHandle = `${socket.username}#${socket.tag}`;

        if (targetSocketId) {
            io.to(targetSocketId).emit('dm response', {
                from: senderHandle,
                accepted: data.accepted,
                publicKey: socket.publicKey
            });
        }
    });
    socket.on('signal', (data) => {
        const targetSocketId = getSocketIdByHandle(data.to);
        const senderHandle = `${socket.username}#${socket.tag}`;

        if (targetSocketId) {
            console.log('Relay signal from', senderHandle, 'to', data.to);
            io.to(targetSocketId).emit('signal', {
                from: senderHandle,
                signal: data.signal
            });
        }
    });
    socket.on('request chat history', () => {
        socket.emit('chat history', chatHistory);
    });
});

server.listen(3000, () => {
    console.log('Server is running on https://localhost:3000');
});
