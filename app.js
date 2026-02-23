let socket;
let myUsername;

//Load sounds
const notificationSound = new Audio('Sounds/Notification.wav');
const userJoinedSound = new Audio('Sounds/UserConnected.wav');
const userLeftSound = new Audio('Sounds/UserDisconnected.wav');
const dmRequestSound = new Audio('Sounds/DMRequest.wav');

//DOM elements
const messageInput = document.getElementById('content');
const usernameInput = document.getElementById('usernameInput');
const imageInput = document.getElementById('attachment');
const sendButton = document.getElementById('send');
const loginButton = document.getElementById('loginButton');
const disconnectButton = document.getElementById('disconnectButton');
const messageList = document.getElementById('messageList');
const loginPage = document.getElementById('loginPage');
const chatPage = document.getElementById('chatPage');
const globalChatButton = document.getElementById('globalChatButton');
const dmNotification = document.getElementById('dmNotif');
const dmRequestText = document.getElementById('dmRequestText');
const acceptDmButton = document.getElementById('acceptDm');
const declineDmButton = document.getElementById('declineDm');

let pendingDmSender = null;
let pendingDmKey = null;

function displayMessage(msg) {
    const item = document.createElement('div');
    item.classList.add('message-bubble');
    const nameSpan = document.createElement('strong');
    nameSpan.textContent = msg.username + ': ';
    item.appendChild(nameSpan);

    if (msg.type === 'image') {
        const img = document.createElement('img');
        img.src = msg.content;
        img.classList.add('chat-image');
        item.appendChild(img);
        img.onload = function() {
            messageList.scrollTop = messageList.scrollHeight;
        }
    } else {
        const textSpan = document.createElement('span');
        textSpan.textContent = msg.content;
        item.appendChild(textSpan);
    }
    messageList.appendChild(item);
    messageList.scrollTop = messageList.scrollHeight;
}

function joinChat(name) {
    myUsername = name;
    const myPublicKey = localStorage.getItem('publicKey');

    let firstJoinTime = localStorage.getItem('joinTime');
    if(!firstJoinTime) {
        firstJoinTime = Date.now();
        localStorage.setItem('joinTime', firstJoinTime);
    }

    socket = io();
    socket.on('join error', function(error) {
        alert(error);
        localStorage.removeItem('username');
        socket.disconnect();
        socket = null;
    });
    socket.on('join success', function() {
        loginPage.style.display = 'none';
        chatPage.style.display = 'block';
    });
    socket.emit('join',{
        username: myUsername,
        firstJoined: parseInt(firstJoinTime),
        publicKey: myPublicKey
    });
    socket.on('chat history', function(history) {
        history.forEach(msg => {
            displayMessage(msg)
        });
    });
    socket.on('chat message', function(msg) {
        displayMessage(msg);
        if(msg.username !== myUsername) {
            notificationSound.play();
            if(msg.username === 'System') {
                if(msg.content.includes('joined')) {
                    userJoinedSound.play();
                }
                else if(msg.content.includes('left')) {
                    userLeftSound.play();
                }
            }
        }
    });
    socket.on('user list', function(users) {
        const userList = document.getElementById('userList');
        userList.innerHTML = '';
        users.forEach(user => {
            const li = document.createElement('li');
            li.textContent = `${user.username}#${user.tag}`;
            userList.appendChild(li);
        });
    });
    socket.on('dm request', function(data) {
        pendingDmSender = data.from;
        pendingDmKey = data.publicKey;

        dmRequestText.textContent = `${pendingDmSender} wants to start a private chat with you.`;
        dmNotification.style.display = 'block';
        dmRequestSound.play();
    });
    socket.on('dm response', function(data) {
        if (data.accepted) {
            alert(`User ${data.from} accepted your DM request!.`);
            // DM Logic
        } else {
            alert(`User ${data.from} declined your DM request.`);
        }
    });
}

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
        messageList.innerHTML = '';
        socket.disconnect();
        socket = null;
        loginPage.style.display = 'block';
        chatPage.style.display = 'none';
    }
});
loginButton.addEventListener('click', function() {
    const name = usernameInput.value.trim();
    if (name === 'System')
    {
        alert('Username "System" is reserved. Please choose another one.');
        return;
    }

    if (name !== '') {
        localStorage.setItem('username', name);
        joinChat(name);
    }
    else {
        alert('Please enter a username');
    }
});
globalChatButton.addEventListener('click', function() {
    document.querySelectorAll('.room-btn').forEach(btn => btn.classList.remove('active'));
    globalChatButton.classList.add('active');
    console.log('Switched to global chat');
});
declineDmButton.addEventListener('click', function() {
    if (pendingDmSender) {
        socket.emit('dm response', {
            to: pendingDmSender,
            accepted: false
        });
        dmNotification.style.display = 'none';
        pendingDmSender = null;
        console.log("Declined DM request from " + pendingDmSender);
    }
});
acceptDmButton.addEventListener('click', function() {
    if (pendingDmSender) {
        socket.emit('dm response', {
            to: pendingDmSender,
            accepted: true
        });
        dmNotification.style.display = 'none';
        // DM Logic - Open DM window, initialize encryption, etc.
        console.log("Starting DM with" + pendingDmSender);
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
imageInput.addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = function(e) {
        const rawData = e.target.result;

        if (file.type === 'image/gif') {
            const msgObject = {
                username: myUsername,
                type: 'image',
                content: rawData
            };
            socket.emit('chat message', msgObject);
            imageInput.value = '';

        } else if (file.type.startsWith('image/')) {
            const img = new Image();
            img.src = rawData;

            img.onload = function() {
                const maxSize = 800;
                let width = img.width;
                let height = img.height;

                if (width > maxSize || height > maxSize) {
                    const aspectRatio = width / height;
                    if (aspectRatio > 1) {
                        width = maxSize;
                        height = maxSize / aspectRatio;
                    } else {
                        height = maxSize;
                        width = maxSize * aspectRatio;
                    }

                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    const resizedImage = canvas.toDataURL('image/jpeg', 0.7);
                    
                    socket.emit('chat message', {
                        username: myUsername,
                        type: 'image',
                        content: resizedImage
                    });
                } else {
                    socket.emit('chat message', {
                        username: myUsername,
                        type: 'image',
                        content: rawData
                    });
                }
                imageInput.value = '';
            };
        }
    };
    reader.readAsDataURL(file);
});

(async function initApp() {
    await Identity.loadOrCreate();
    console.log('Identity ready, you can now join the chat');

    const savedName = localStorage.getItem('username');
    if (savedName) {
        joinChat(savedName);
    }
})();