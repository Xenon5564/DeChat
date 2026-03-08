import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { Identity } from './identity';
import UserList from "./components/UserList";
import './App.css';

function App() {

  const [socket, setSocket] = useState(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [myUsername, setMyUsername] = useState(localStorage.getItem('username') || '');
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [joining, setJoining] = useState(false);
  const [typedMessage, setTypedMessage] = useState('');

  const messageListRef = useRef(null);

  useEffect(() => {
    let newSocket;
    let active = true;
    const bootUp = async () => {
      await Identity.loadOrCreate();
      if(!active) return;
      console.log("Identity Ready");

      newSocket = io(); 
      setSocket(newSocket);

      newSocket.on('user list', (users) => setOnlineUsers(users));
      newSocket.on('chat message', (msg) => {
        setMessages((prev) => [...prev, msg]);
      });
      newSocket.on('join success', () => 
      {
          setLoggedIn(true);
          setJoining(false);
      });
      newSocket.on('join error', (err) => {
        alert(err);
        setJoining(false);
        localStorage.removeItem('username');
      });
      newSocket.on('chat history', (history) => 
      {
        setMessages(history);
      })

      const savedName = localStorage.getItem('username');
      if (savedName) {
        const myPublicKey = localStorage.getItem('publicKey');
        setJoining(true);
        newSocket.emit('join', {
          username: savedName,
          publicKey: myPublicKey,
          firstJoined: parseInt(localStorage.getItem('joinTime')) || Date.now()
        });
      }
    };

    bootUp();

    return () => {
      if (newSocket) {
        newSocket.disconnect();
        newSocket.off('chat message');
        newSocket.off('user list');
      }
      active = false;
    };
  }, []);

  useEffect(() => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  }, [messages]);

  const handleLogin = () => {
    if (loggedIn) return;
    if (!myUsername.trim()) return alert("Enter a name");
    if (myUsername === "System") return alert("This name is reserved. Pick another one");

    localStorage.setItem('username', myUsername);
    setJoining(true);
    socket.emit('join', {
      username: myUsername,
      publicKey: localStorage.getItem('publicKey'),
      firstJoined: Date.now()
    });
  };

  const handleSendMessage = async () => {
    if(!typedMessage.trim() || !socket) return;

    const sig = await Identity.sign(typedMessage.trim());
    const msgObject= {
      username: myUsername,
      type: 'text',
      timestamp: Date.now(),
      content: typedMessage.trim(),
      signature: sig
    };

    
    socket.emit('chat message', msgObject);

    setTypedMessage('');
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if(!file || !socket) return;

    if(file.size > 50 * 1024 * 1024) return alert("File too big (Max 50MB)");

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/upload', { method: 'POST', body: formData});
      const result = await response.json();
      const sig = await Identity.sign(result.url);
      
      const msgObject = {
        username: myUsername,
        type: 'image',
        timestamp: Date.now(),
        content: result.url,
        signature: sig
      };

      socket.emit('chat message', msgObject);
    } catch (err) {
      console.error("Upload failed", err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('username');
    window.location.reload();
  };

  return (
    <div id="container">
      <h1>DeChat React</h1>

      {!loggedIn ? (
        /* LOGIN SCREEN */
        <div id="loginPage">
          <input 
            type="text"
            id="usernameInput"
            value={myUsername} 
            onChange={(e) => setMyUsername(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            disabled={joining}
            placeholder="Username..."
          />
          <button onClick={handleLogin} disabled={joining} id="loginBtn">
            {joining ? "Connecting..." : "Connect"}
          </button>
        </div>
      ) : (
        /* CHAT SCREEN */
        <div id="chatPage" style={{display: 'flex', flexDirection: 'column'}}>
          <div id="chatBody">
            <div id="messageContainer">
              <div id="messageList" ref={messageListRef}>
                {messages.map((msg, idx) => (
                  <div key={idx} className="message-bubble">
                    <strong>{msg.username}: </strong>
                    {msg.type === 'image' ? (
                      <img src={msg.content} className='chat-image' alt="upload" />
                    ) : (
                      <span>{msg.content}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            <UserList users={onlineUsers} myKey={localStorage.getItem('publicKey')} />
          </div>

          <div id="inputArea">
            <input
              type="text"
              value={typedMessage}
              onChange={(e) => setTypedMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type a message..."
              id="messageContent"
            />
            <label htmlFor="attachmentInput" id="attachmentBtn">🖼️</label>
            <input
              type="file"
              id="attachmentInput"
              accpet="image/*"
              onChange={handleImageUpload}
              style={{display: 'none'}}
            />
            <button id="sendBtn" onClick={handleSendMessage}>Send</button>
            <button id="disconnectBtn" onClick={() => handleLogout()}>Disconnect</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;