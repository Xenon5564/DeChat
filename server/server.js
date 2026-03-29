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
    maxHttpBufferSize: 1e8,
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"]
    }
});

let chatChannels = [];
let chatHistories = {};

let onlineUsers = {};
let knownUsers = {};

app.use(express.static(__dirname)); //__dirname - dev "../client/dist" - production
app.use('/uploads', express.static('uploads'));

function initializeChannels()
{
    const defaultChannel = [
        {id: "general", name: "General", type:"text"}
    ];

    try {
        if (!fs.existsSync('channels.json')) {
            console.log("Channels file not found, generating default...");
            
            const jsonString = JSON.stringify(defaultChannel, null, 2);
            fs.writeFileSync('channels.json', jsonString, 'utf8');
            chatChannels = defaultChannel;
        } else {
            console.log("Found channels.json, loading config...");
            const fileContent = fs.readFileSync('channels.json', 'utf8');
            chatChannels = JSON.parse(fileContent);
        }
    } catch (err) {
        console.error("Error initializing channels", err);
    }

    chatChannels.forEach(channel => {
        if (!chatHistories[channel.id]) {
            chatHistories[channel.id] = [];
        }
    });

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

        socket.username = data.username;
        socket.publicKey = data.publicKey;
        socket.avatar = data.avatar;
        onlineUsers[socket.id] = {
            username: socket.username,
            publicKey: socket.publicKey,
            avatar: socket.avatar
        };
        knownUsers[socket.publicKey] = {
            username: socket.username,
            publicKey: socket.publicKey,
            avatar: socket.avatar
        };
        
        socket.emit('join success');
        
        socket.emit('channel list', chatChannels);

        console.log(`${socket.username} joined the chat`);
        const connectMessage = { 
            username: 'System', 
            timestamp: Date.now(),
            content: `${socket.username} has joined the chat`
        };
        
        io.emit('chat message', connectMessage);
        io.emit('user list', Object.values(onlineUsers));
        io.emit('known users', knownUsers);
    });
    socket.on('chat message', async (msg) => {
        try {
            const user = onlineUsers[socket.id];
            const roomId = msg.roomId;
            if (!chatHistories[roomId]) chatHistories[roomId] = [];
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
                const fullHandle = `${socket.username}`;
                msg.timestamp = Date.now();
                msg.username = fullHandle;
                chatHistories[roomId].push(msg);
                io.to(msg.roomId).emit('chat message', msg);
            } else {
                console.warn(`Tampered message was detected from ${socket.username}`);
                socket.emit('chat message', { username: 'System', content: 'Message signature verification failed. Your message was not sent.' });
            }
        } catch (error) {
            console.error('Verification error:', error);
        }
    });
    socket.on('disconnect', () => {
        if (socket.username) {
            console.log(`${socket.username} disconnected`);
    
            delete onlineUsers[socket.id];
            io.emit('user list', Object.values(onlineUsers));

            const disconnectMessage = { 
                username: 'System', 
                timestamp: Date.now(),
                content: `${socket.username} has left the chat` 
            };
            io.emit('chat message', disconnectMessage);
        }
    });
    socket.on('request chat history', (roomId) => {
        const history = chatHistories[roomId] || [];
        socket.emit('chat history', history);
    });
    socket.on('switch room', (newRoom) => {
        socket.leave(socket.lastRoom);
        socket.join(newRoom);
        socket.lastRoom = newRoom;
    })
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

initializeChannels();

server.listen(3000, () => {
    console.log('Server is running on https://localhost:3000');
});