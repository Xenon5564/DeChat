import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { CryptoEngine } from './CryptoEngine';
import { Vault } from './Vault';
import { embedProviders } from './utils/embedProviders';
import UserList from "./components/Userlist";
import ChannelList from "./components/Channellist";
import Message from "./components/Message";
import './App.css';

function App() {
  const [socket, setSocket] = useState(null);
  const [loginState, setLoginState] = useState('CHECK');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [joining, setJoining] = useState(false);
  const [typedMessage, setTypedMessage] = useState('');
  const [channels, setChannels] = useState([]);
  const [unreadChannels, setUnreadChannels] = useState([]);
  const [currentRoom, setCurrentRoom] = useState('');

  const messageListRef = useRef(null);
  const currentRoomRef = useRef(currentRoom);

  useEffect(() => {
    currentRoomRef.current = currentRoom;
  }, [currentRoom]);

  // useEffect(() => {
  //   let newSocket;
  //   const bootUp = async () => {
  //     await Identity.loadOrCreate();
      
  //     newSocket = io();
  //     setSocket(newSocket);

  //     newSocket.on('channel list', (chans) => {
  //       setChannels(chans);
  //       // Automatically switch to first channel on initial load
  //       if (chans.length > 0) {
  //         switchRoom(chans[0].id, newSocket);
  //       }
  //     });

  //     newSocket.on('user list', (users) => setOnlineUsers(users));
      
  //     newSocket.on('chat message', (msg) => {
  //       if (msg.roomId === currentRoomRef.current || msg.username === 'System') {
  //         setMessages((prev) => [...prev, msg]);
  //       } else {
  //         setUnreadChannels((prev) => ({
  //           ...prev,
  //           [msg.roomId]: true
  //         }));
  //       }
  //     });

  //     newSocket.on('join success', () => {
  //       setLoggedIn(true);
  //       setJoining(false);
  //     });

  //     newSocket.on('join error', (err) => {
  //       alert(err);
  //       setJoining(false);
  //       localStorage.removeItem('username');
  //     });

  //     newSocket.on('chat history', (history) => {
  //       setMessages(history);
  //     });

  //     const savedName = localStorage.getItem('username');
  //     if (savedName) {
  //       setJoining(true);
  //       newSocket.emit('join', {
  //         username: savedName,
  //         publicKey: localStorage.getItem('publicKey'),
  //         firstJoined: parseInt(localStorage.getItem('joinTime')) || Date.now()
  //       });
  //     }
  //   };

  //   bootUp();
  //   return () => { if (newSocket) newSocket.disconnect(); };
  // }, []);

  useEffect(() => {
    setTimeout(() => {
      setLoginState('NO_PROFILE');
    }, 1000);
  },[]);

  useEffect(() => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  }, [messages]);

  const switchRoom = (targetRoomId, activeSocket = socket) => {
    if (targetRoomId === currentRoomRef.current) return;
    setCurrentRoom(targetRoomId);
    setMessages([]);

    setUnreadChannels((prev) => ({
      ...prev,
      [targetRoomId]: false
    }));

    if (activeSocket) {
      activeSocket.emit('switch room', targetRoomId);
      activeSocket.emit('request chat history', targetRoomId);
    }
  };

  const handleLogin = () => {
    if (loggedIn || !socket) return;
    if (!myUsername.trim()) return alert("Enter a name");
    if (myUsername === "System") return alert("Name reserved.");

    localStorage.setItem('username', myUsername);
    setJoining(true);
    socket.emit('join', {
      username: myUsername,
      publicKey: localStorage.getItem('publicKey'),
      firstJoined: Date.now()
    });
  };

  const handleSendMessage = async () => {
    if (!typedMessage.trim() || !socket) return;
    const sig = await Identity.sign(typedMessage.trim());
    socket.emit('chat message', {
      username: myUsername,
      type: 'text',
      timestamp: Date.now(),
      content: typedMessage.trim(),
      signature: sig,
      roomId: currentRoom
    });
    setTypedMessage('');
  };

  const handleMediaUpload = async (e) => {
    const file = e.target.files[0];
    if(!file || !socket) return;

    if(file.size > 100 * 1024 * 1024) return alert("File too big (Max 100MB)");

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/upload', { method: 'POST', body: formData});
      const result = await response.json();
      const sig = await Identity.sign(result.url);
      
      const msgObject = {
        username: myUsername,
        type: 'media',
        timestamp: Date.now(),
        content: result.url,
        signature: sig,
        roomId: currentRoom
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

  const handleCreateProfile = async () => {
    if (!username.trim() || !password.trim()) {
      return alert("Username and password are both required");
    }

    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    const key = await Vault.deriveKey(password, salt);

    const profileObj = { username: username };

    const encryptedProfile = await Vault.encryptProfile(key, profileObj);

    console.log(encryptedProfile);

    const decryptedProfile = await Vault.decryptProfile(key, encryptedProfile.iv, encryptedProfile.ciphertext);
    console.log(decryptedProfile);
  }

  const scrollToBottom = () => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  };

  const renderScreen = () => {
    switch (loginState) {
      case 'CHECK':
        return <h2>Checking for profile...</h2>;
      
      case 'NO_PROFILE':
        return (
          <div id="loginPage">
            <h2>No profile found in memory</h2>
            <button onClick= {() => setLoginState('CREATE')}>Create New Profile</button>
            <button onClick= {() => alert("Import profile (coming soon)")}>Load Existing Profile</button>
          </div>
        );

        case 'CREATE':
          return (
            <div id="creationPage" style={{ display: 'flex', flexDirection: 'column', gap: '15px', padding: '60px'}}>
              <h2>Create Your Profile</h2>
              <p style={{ fontSize: '0.8em', color: '#888' }}>
                Your password encrypts your local profile file, If you lose the password, you will irreversably lose this account.
              </p>

              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Choose a username..."
              />

              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Choose a password..."
              />

              <button onClick={handleCreateProfile}> Generate & Encrypt Profile</button>
              <button onClick={() => setLoginState('NO_PROFILE')} style={{ backgroundColor: '#f44336' }}>
                Cancel
              </button>
            </div>
          );

        case 'CHAT':
          return (
            <div id="chatPage">
            <div id="chatBody">
              <ChannelList channels={channels} currentRoom={currentRoom} unreadChannels={unreadChannels} onSwitch={(id) => switchRoom(id, socket)} />
              <div id="messageContainer">
                <div id="messageList" ref={messageListRef}>
                  {messages.map((msg, idx) => (
                    <Message key={idx} msg={msg} onMediaLoad={scrollToBottom} />
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
                onChange={handleMediaUpload}
                style={{display: 'none'}}
              />
              <button id="sendBtn" onClick={handleSendMessage}>Send</button>
              <button id="disconnectBtn" onClick={() => handleLogout()}>Disconnect</button>
            </div>
          </div>
        );

        default:
          return <h2>Default return.</h2>
    }
  }

  return (
      <div id="container">
          <h1>DeChat</h1>
          {renderScreen()}
      </div>
  );
}

export default App;