import { Identity } from './identity.js'

let socket;
let myUsername;
let globalUserList = [];
let currentRoom = 'global';
let dmHistories = {};

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
    if (socket) {
            ocket.emit('chat message', msgObject);
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
imageInput.addEventListener('change', async function(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
        alert("File is too large! Maximum size is 50MB.");
        imageInput.value = ''; // Reset input
        return;
    }

    try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/upload', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`Upload failed: ${response.statusText}`)
        }

        const result = await response.json();

        const msgObject = {
            username: myUsername,
            type: 'image',
            timestamp: Date.now(),
            content: result.url
        };

        routeMessage(msgObject);
    } catch (error) {
        console.error("Error uploading image:", error);
        alert("Failed to upload image. Check console for details.");
    } finally {
        imageInput.value = '';
    }
});


(async function initApp() {
    await Identity.loadOrCreate();
    console.log('Identity ready, you can now join the chat');

    const savedName = localStorage.getItem('username');
    if (savedName) {
        joinChat(savedName);
    }
})();