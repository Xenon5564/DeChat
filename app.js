const socket = io();
const messageInput = document.getElementById('message');
const sendButton = document.getElementById('send');
const messageList = document.getElementById('messageList');

function sendMessage(event) {
    if(event.key === 'Enter' || event.type === 'click') {
        const message = messageInput.value;
        if (message.trim() !== '') {
            socket.emit('chat message', message);
            
            messageInput.value = '';
        }
    }
}

sendButton.addEventListener('click', sendMessage);

socket.on('chat message', function(msg) {
    const messageElement = document.createElement('div');
    messageElement.textContent = msg;
    messageList.appendChild(messageElement);
});

