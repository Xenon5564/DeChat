const peers = {};

const rtcConfig = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' }
    ]
};

function createPeerConnection(targetHandle, initiator) {
    console.log("Createing RTC peer connection with", targetHandle);
    
    const pc = new RTCPeerConnection(rtcConfig);

    peers[targetHandle] = {
        connection: pc,
        dataChannel: null
    };

    pc.onicecandidate = (event) => {
        if (event.candidate) {
            socket.emit('signal', {
                to: targetHandle,
                signal: { type: 'candidate', candidate: event.candidate }
            });
        }
    };

    if (initiator) {
        const channel = pc.createDataChannel('chat');
        setupDataChannel(channel, targetHandle);
        peers[targetHandle].dataChannel = channel;
    } else {
        pc.ondatachannel = (event) => {
            const channel = event.channel;
            setupDataChannel(channel, targetHandle);
            peers[targetHandle].dataChannel = channel;
        };
    }

    return pc;
}

function setupDataChannel(channel, targetHandle) {
    channel.onopen = () => {
        console.log('Data channel open with', targetHandle);
         
        if (!dmHistories[targetHandle]) {
            dmHistories[targetHandle] = [];
        }

        const listItem = document.createElement('li');
        listItem.textContent = targetHandle;
        listItem.id = `dm-btn-${targetHandle}`;

        listItem.addEventListener('click', () => {
            switchRoom(targetHandle);
        });

        document.getElementById('dmList').appendChild(listItem);
    };
    channel.onmessage = (event) => {
       const msgObject = JSON.parse(event.data);

       dmHistories[targetHandle].push(msgObject);
        if (currentRoom === targetHandle) {
            displayMessage(msgObject);
        } else {
            console.log('Received a BG DM from', targetHandle);
            notificationSound.play();
        }
    };
}