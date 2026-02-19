const nameInput = document.getElementById('name');
const connectButton = document.getElementById('connect');
const slider = document.getElementById('volume');

connectButton.addEventListener('click', function() {
    const userText = nameInput.value;
    console.log('User input:', userText);
    nameInput.value = '';
});