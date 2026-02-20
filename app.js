let socket;
let myUsername;

const messageInput = document.getElementById('content');
const usernameInput = document.getElementById('usernameInput');

const sendButton = document.getElementById('send');
const loginButton = document.getElementById('loginButton');
const disconnectButton = document.getElementById('disconnectButton');

const messageList = document.getElementById('messageList');
const loginPage = document.getElementById('loginPage');
const chatPage = document.getElementById('chatPage');

function displayMessage(msg) {
    const item = document.createElement('div');
    item.textContent = msg.username + ': ' + msg.content;
    messageList.appendChild(item);
    messageInput.scrollTop = messageList.scrollHeight;
}

function joinChat(name) {
    myUsername = name;
    
    let firstJoinTime = localStorage.getItem('joinTime');
    if(!firstJoinTime) {
        firstJoinTime = Date.now();
        localStorage.setItem('joinTime', firstJoinTime);
    }

    socket = io();

    socket.emit('join',{
        username: myUsername,
        firstJoined: parseInt(firstJoinTime)
    });
    
    loginPage.style.display = 'none';
    chatPage.style.display = 'block';

    socket.on('chat history', function(history) {
        history.forEach(msg => {
            displayMessage(msg)
        });
    });

    socket.on('chat message', function(msg) {
        displayMessage(msg);
    });
}

loginButton.addEventListener('click', function() {
    const name = usernameInput.value.trim();
    if (name !== '') {
        localStorage.setItem('username', name);
        joinChat(name);
    }
    else {
        alert('Please enter a username');
    }
});

function sendMessage(event) {
    const text = messageInput.value.trim();
    if (text !== '' && socket) {
        const msgObject = {
            username: myUsername,
            content: text
        };
        socket.emit('chat message', msgObject);
        messageInput.value = '';
    }
}

sendButton.addEventListener('click', sendMessage);
disconnectButton.addEventListener('click', function() {
    if (socket) {
        socket.emit('chat message', { username: 'System', content: myUsername + ' has left the chat' });
        socket.disconnect();
        socket = null;
        loginPage.style.display = 'block';
        chatPage.style.display = 'none';
    }
});
messageInput.addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        sendMessage(event);
    }
})
usernameInput.addEventListener('keydown', function(event) {;
    if (event.key === 'Enter') {
        loginButton.click();
    }
});

const savedName = localStorage.getItem('username');
if (savedName) {
    joinChat(savedName);
}

