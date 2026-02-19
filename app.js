const messageInput = document.getElementById('message');
const sendButton = document.getElementById('send');
const messageList = document.getElementById('messageList');

function sendMessage(event) {
    if(event.key === 'Enter' || event.type === 'click') {
        const message = messageInput.value;
        if (message.trim() !== '') {
            const messageElement = document.createElement('div');
            messageElement.textContent = `You: ${message}`;
            messageList.appendChild(messageElement);
            messageInput.value = '';
        }
    }
}

sendButton.addEventListener('click', sendMessage);

