const message = {
    username: 'guest',
    content: 'Hello'
}

const socket = io();
const messageInput = document.getElementById('content');
const usernameInput = document.getElementById('usernameInput');
const sendButton = document.getElementById('send');
const messageList = document.getElementById('messageList');


function sendMessage(event) {
    if(event.key === 'Enter' || event.type === 'click') {
        const content = messageInput.value;
        if (content.trim() !== '') {
            const name = usernameInput.value.trim() || 'Anonymous';
            const messageContent = content.trim();
            const messageObject = {username: name, content: messageContent};

            socket.emit('chat message', messageObject);
            messageInput.value = '';
        }
    }
}

sendButton.addEventListener('click', sendMessage);

socket.on('chat message', function(msg) {
    const messageElement = document.createElement('div');
    messageElement.textContent = msg.username + ': ' + msg.content;
    messageList.appendChild(messageElement);
});

