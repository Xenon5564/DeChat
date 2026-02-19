const { Server } = require('socket.io');
const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const io = new Server(server);

io.on('connection', function(socket) {
    console.log('A user connected');

    socket.on('chat message', function(msg) {
        io.emit('chat message', msg);
    });
});

app.use(express.static(__dirname));

server.listen(3000, function() {
    console.log('Server is listening on port 3000');
});

