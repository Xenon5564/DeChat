let socket;
let myUsername;
let globalUserList = [];
let currentRoom = 'global';
let dmHistories = {};

//Load sounds
const notificationSound = new Audio('Sounds/Notification.wav');
const userJoinedSound = new Audio('Sounds/UserConnected.wav');
const userLeftSound = new Audio('Sounds/UserDisconnected.wav');
const dmRequestSound = new Audio('Sounds/DMRequest.wav');
const dmAcceptSound = new Audio('Sounds/DMAccept.wav');
const dmDeclineSound = new Audio('Sounds/DMDecline.wav');

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

function renderUserList() {
    const userList = document.getElementById('userList');
    userList.innerHTML = '';
    const myKey = localStorage.getItem('publicKey');

    if (currentRoom === 'global') {
        globalUsersList.forEach(user => {
            const li = document.createElement('li');

            if (typeof user === 'object') {
                let displayName = `${user.username}#${user.tag}`;
                if (user.publicKey === myKey) {
                    displayName += " (You)";
                }
                
                li.textContent = displayName;
            } else {
                li.textContent = user;
            }
            
            userList.appendChild(li);
        });
    }
    else {
        const targetLi = document.createElement('li');
        targetLi.textContent = currentRoom;
        userList.appendChild(targetLi);

        const myLi = document.createElement('li');
        
        const myData = globalUsersList.find(u => u.username === myUsername);
        
        if (myData && typeof myData === 'object') {
            myLi.textContent = `${myData.username}#${myData.tag} (You)`;
        } else {
            myLi.textContent = `${myUsername} (You)`;
        }
        
        userList.appendChild(myLi);
    }
}

function switchRoom(targetRoom) {
    currentRoom = targetRoom;

    document.querySelectorAll('.room-btn, #dmList li').forEach(el => {
        el.classList.remove('active');
    });

    if (targetRoom === 'global') {
        globalChatButton.classList.add('active');
    } else {
        const dmItem = document.getElementById(`dm-btn-${targetRoom}`);
        if (dmItem) dmItem.classList.add('active');
    }

    messageList.innerHTML = '';
    let activeBtn;

    if (targetRoom === 'global') {
        socket.emit('request chat history');
        activeBtn = globalChatButton;
    } else {
        const history = dmHistories[targetRoom] || [];
        history.forEach(msg => displayMessage(msg));
        activeBtn = document.getElementById(`dm-btn-${targetRoom}`);
    }

    if (activeBtn) {
        activeBtn.classList.add('active');
        activeBtn.classList.remove('unread');
    }

    renderUserList();
}

async function routeMessage(msgObject) {
    msgObject.timestamp = Date.now();
    
    const sig = await Identity.sign(msgObject.content);
    msgObject.signature = sig;

    if (currentRoom === 'global') {
        if (socket) {
            socket.emit('chat message', msgObject);
        }
    } else {
        const channel = peers[currentRoom].dataChannel;
        if (channel && channel.readyState === 'open') {
            channel.send(JSON.stringify(msgObject));
            
            displayMessage(msgObject);
            dmHistories[currentRoom].push(msgObject);
        } else {
            console.log("Error: Data channel is not open yet.");
        }
    }
}

function displayMessage(msg) {
    const item = document.createElement('div');
    item.classList.add('message-bubble');
    const nameSpan = document.createElement('strong');
    const timeSpan = document.createElement('span');
    timeSpan.classList.add('timestamp');
    const date = new Date(msg.timestamp);
    const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false});
    timeSpan.textContent = ` [${timeString}]`;
    nameSpan.textContent = ' ' + msg.username + ': ';
    item.appendChild(timeSpan);
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
        if (currentRoom === 'global') {
            displayMessage(msg);
        } else {
            globalChatButton.classList.add('unread');
        }

        if (msg.username === 'System') {
            if (msg.content.includes('joined')) {
                userJoinedSound.currentTime = 0;
                userJoinedSound.play();
            } else if (msg.content.includes('left')) {
                userLeftSound.currentTime = 0;
                userLeftSound.play();
            }
        }

        if (msg.username !== myUsername) {
            notificationSound.currentTime = 0;
            notificationSound.play();
        }
    });
    socket.on('user list', function(users) {
        globalUsersList = users;
        renderUserList(users);
    });
    socket.on('dm request', function(data) {
        pendingDmSender = data.from;
        pendingDmKey = data.publicKey;

        dmRequestText.textContent = `${pendingDmSender} wants to start a private chat with you.`;
        dmNotification.style.display = 'block';
        dmRequestSound.play();
    });
    socket.on('dm response', async function(data) {
        if (data.accepted) {
            dmAcceptSound.currentTime = 0;
            dmAcceptSound.play();

            const pc = createPeerConnection(data.from, true, data.publicKey);
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            socket.emit('signal', {
                to: data.from,
                signal: { type: 'offer', sdp: offer }
            });
        } else {
            dmDeclineSound.currentTime = 0;
            dmDeclineSound.play();
        }
    });
    socket.on('signal', async function(data) {
        const targetHandle = data.from;
        const signal = data.signal;

        const peerObj = peers[targetHandle];
        if (!peerObj) return;

        const pc = peerObj.connection;

        if (signal.type === 'offer') {
            await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
            const anwser = await pc.createAnswer();
            await pc.setLocalDescription(anwser);

            socket.emit('signal', {
                to: targetHandle,
                signal: { type: 'answer', sdp: anwser }
            });
        } else if (signal.type === 'answer') {
            await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
        } else if (signal.type === 'candidate') {
            await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
        }
    });
}

function sendMessage(event) {
    const text = messageInput.value.trim();
    if (text !== '') {
        const msgObject = {
            username: myUsername,
            type: 'text',
            content: text
        };
        routeMessage(msgObject);
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
    switchRoom('global');
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
        
        createPeerConnection(pendingDmSender, false, pendingDmKey);
        dmNotification.style.display = 'none';
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
    if (file.size >= 10485760) {
        alert('File too big! Max. 10MB');
        return;
    }
    const reader = new FileReader();

    reader.onload = function(e) {
        const rawData = e.target.result;

        if (file.type === 'image/gif') {
            const msgObject = {
                username: myUsername,
                type: 'image',
                content: rawData
            };
            routeMessage(msgObject);
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

                    const msgObject = {
                        username: myUsername,
                        type: 'image',
                        content: resizedImage
                    };
                    routeMessage(msgObject);
                } else {
                    const msgObject = {
                        username: myUsername,
                        type: 'image',
                        content: rawData
                    };
                    routeMessage(msgObject);
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