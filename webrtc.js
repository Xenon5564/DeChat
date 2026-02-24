const peers = {};

const rtcConfig = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' }
    ]
};

function createPeerConnection(targetHandle, initiator, remoteKeyString) {
    console.log("Createing RTC peer connection with", targetHandle);
    
    const pc = new RTCPeerConnection(rtcConfig);

    peers[targetHandle] = {
        connection: pc,
        dataChannel: null,
        remotePublicKey: remoteKeyString
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
        listItem.classList.add('room-btn');
        listItem.textContent = targetHandle;
        listItem.id = `dm-btn-${targetHandle}`;

        listItem.addEventListener('click', () => {
            switchRoom(targetHandle);
        });

        document.getElementById('dmList').appendChild(listItem);
    };
    channel.onmessage = async (event) => {
        const msgObject = JSON.parse(event.data);
        const peerData = peers[targetHandle];

        try {
            const publicKeyObject = await Identity.importKey(peerData.remotePublicKey, 'verify');
            const isValid = await Identity.verify(msgObject.content, msgObject.signature, publicKeyObject);

            if (isValid) {
                dmHistories[targetHandle].push(msgObject);
                if (currentRoom === targetHandle) {
                    displayMessage(msgObject);
                    } else {
                        const btn = document.getElementById(`dm-btn-${targetHandle}`);
                        if (btn) btn.classList.add('unread');
                    }

                    notificationSound.currentTime = 0;
                    notificationSound.play();
            } else {
                console.warn('Invalid signature for message from', targetHandle);
            }
        } catch (error) {
            console.error('Error verifying message from', targetHandle, error);
        }
    };
}