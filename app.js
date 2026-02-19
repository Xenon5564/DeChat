const messageInput = document.getElementById('message');
const sendButton = document.getElementById('send');
const messageList = document.getElementById('messageList');

sendButton.addEventListener('click', function() {
    const userText = messageInput.value;
    const newMessage = document.createElement('div');
    newMessage.textContent = userText;
    messageList.appendChild(newMessage);
    messageInput.value = '';
});