const { Server } = require('socket.io');
const { webcrypto } = require('node:crypto');
const { subtle } = webcrypto;
const express = require('express');
const https = require('https');
const multer = require('multer');
const fs = require('fs');
const app = express();

const options = {
    key: fs.readFileSync('key.pem'),
    cert: fs.readFileSync('cert.pem')
};

const server = https.createServer(options, app);
const io = new Server(server, {
    maxHttpBufferSize: 10485760
});

let chatHistory = [];
let onlineUsers = {};

app.use(express.static(__dirname));
app.use('/uploads', express.static('uploads'));

function generateTag(keyString) {
    if(!keyString) return '0000';
     
    let hash = 0;
    for (let i = 0; i < keyString.length; i++) {
        hash = (hash << 5) - hash + keyString.charCodeAt(i);
        hash |= 0; // Convert to 32bit integer
    }

    return Math.abs(hash).toString(16).substring(0, 4).toUpperCase();
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
        const sufix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, sufix + '-' + file.originalname);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 100 * 1024 * 1024}
});

app.post('/upload', upload.single('file'), (req, res) => {
    if(!req.file) {
        return res.status(400).send('No file uploaded.');
    }

    const fileUrl = '/uploads/' + req.file.filename;
    res.json({ url: fileUrl});
});

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
        
        io.emit('chat message', connectMessage);
        io.emit('user list', Object.values(onlineUsers));
        
        socket.emit('chat history', chatHistory);
    });
    socket.on('chat message', async (msg) => {
        try {
            const user = onlineUsers[socket.id];
            if (!user || !user.publicKey) return;

            const publicKeyObject = await importUserPublicKey(user.publicKey);
            const encoder = new TextEncoder();
            const contentBytes = encoder.encode(msg.content);
            const signatureBytes = Buffer.from(msg.signature, 'base64');

            const isValid = await subtle.verify(
                { name: "RSA-PSS", saltLength: 32 },
                publicKeyObject,
                signatureBytes,
                contentBytes
            );

            if (isValid) {
                msg.timestamp = Date.now();
                const fullHandle = `${socket.username}#${socket.tag}`;
                msg.username = fullHandle;
                if (msg.username !== 'System') chatHistory.push(msg);
                io.emit('chat message', msg);
            } else {
                console.warn(`Tampered message was detected from ${socket.username}#${socket.tag}`);
                socket.emit('chat message', { username: 'System', content: 'Message signature verification failed. Your message was not sent.' });
            }
        } catch (error) {
            console.error('Verification error:', error);
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
            io.emit('chat message', disconnectMessage);
        }
    });
    socket.on('request chat history', () => {
        socket.emit('chat history', chatHistory);
    });
});

async function importUserPublicKey(jwk) {
    const keyData = JSON.parse(jwk);
    return await subtle.importKey(
        "jwk",
        keyData,
        {
            name: "RSA-PSS",
            hash: "SHA-256"
        },
        true,
        ["verify"]
    );
}

server.listen(3000, () => {
    console.log('Server is running on https://localhost:3000');
});