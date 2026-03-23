import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { CryptoEngine } from './CryptoEngine';
import { Vault } from './Vault';
import { DBHandler, DB_KEYS  } from './DBHandler';
import { embedProviders } from './utils/embedProviders';

import UserList from "./components/Userlist/Userlist";
import ChannelList from "./components/Channellist/Channellist";
import Message from "./components/Message/Message";
import InputArea from "./components/InputArea/InputArea";

import NoProfileState from "./siteStates/no_profile/noProfile";
import Register from "./siteStates/register/register";
import Login from "./siteStates/login/login";

import './App.css';

function App() {
  const [socket, setSocket] = useState(null);
  const [loginState, setLoginState] = useState('CHECK');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [publicKey, setPublicKey] = useState('');
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [typedMessage, setTypedMessage] = useState('');
  const [channels, setChannels] = useState([]);
  const [unreadChannels, setUnreadChannels] = useState([]);
  const [currentRoom, setCurrentRoom] = useState('');

  const messageListRef = useRef(null);
  const currentRoomRef = useRef(currentRoom);

  useEffect(() => {
    currentRoomRef.current = currentRoom;
  }, [currentRoom]);

  useEffect(() => {
    if (loginState !== 'CHAT') return;

    let newSocket;

    const connect = async () => {
      newSocket = io();
      setSocket(newSocket);

      newSocket.on('channel list', (chans) => {
        setChannels(chans);
        if (chans.length > 0) {
          switchRoom(chans[0].id, newSocket);
        }
      });

      newSocket.on('user list', (users) => setOnlineUsers(users));
      
      newSocket.on('chat message', (msg) => {
        if (msg.roomId === currentRoomRef.current || msg.username === 'System') {
          setMessages((prev) => [...prev, msg]);
        } else {
          setUnreadChannels((prev) => ({
            ...prev,
            [msg.roomId]: true
          }));
        }
      });
      
      newSocket.on('join error', (err) => {
        alert(err);
        handleLogout();
      });

      newSocket.on('chat history', (history) => {
        setMessages(history);
      });

      newSocket.emit('join', {
        username: username,
        publicKey: publicKey
      });
    };

    connect();
    return () => { if (newSocket) newSocket.disconnect(); };
  }, [loginState]);

  useEffect(() => {
    checkForProfile();
    
  },[]);

  useEffect(() => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  }, [messages]);

  const checkForProfile = async () => {
    setUsername('');
    setPassword('');
    const profileExists = await DBHandler.has(DB_KEYS.PROFILE);
      
    const newState = profileExists ? 'UNLOCK' : 'NO_PROFILE';
    setLoginState(newState);
    CryptoEngine.generateSignKeys();
  };

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
    const sig = await CryptoEngine.sign(typedMessage.trim());
    socket.emit('chat message', {
      username: username,
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
      const sig = await CryptoEngine.sign(result.url);
      
      const msgObject = {
        username: username,
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
    CryptoEngine.wipeSession();
    setLoginState('CHECK');
    checkForProfile();
  };

  const handleCreateProfile = async () => {
    if (!username.trim() || !password.trim()) {
      return alert("Username and password are both required");
    }

    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    const key = await Vault.deriveKey(password, salt);  // Create our AES key
    const signKeyPair = await CryptoEngine.generateSignKeys(); // Create our RSA keys

    const profileObj = { username: username, signKeys: signKeyPair };
    const encryptedProfile = await Vault.encryptProfile(key, profileObj);

    await DBHandler.put(DB_KEYS.PROFILE, { profile: encryptedProfile, salt: salt });
    setUsername('');
    setPassword('');
    setLoginState('UNLOCK');
  }

  const handleUnlock = async () => {
    const encryptedProfile = await DBHandler.get(DB_KEYS.PROFILE);
    const aesKey = await Vault.deriveKey(password, encryptedProfile.salt);

    try {
      const decryptedProfile = await Vault.decryptProfile(aesKey, encryptedProfile.profile.iv, encryptedProfile.profile.ciphertext);
      console.log(decryptedProfile);

      CryptoEngine.importKeys(decryptedProfile.signKeys);
      setUsername(decryptedProfile.username);
      setPublicKey(JSON.stringify(decryptedProfile.signKeys.publicKey));
      setLoginState('CHAT');
    } catch (error) {
      alert('Wrong password');
    }
    
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
        return <NoProfileState setLoginState={setLoginState} />;

      case 'CREATE':
        return <Register username={username} setUsername={setUsername} password={password} setPassword={setPassword} handleCreateProfile={handleCreateProfile} setLoginState={setLoginState} />;

      case 'UNLOCK':
        return <Login password={password} setPassword={setPassword} handleUnlock={handleUnlock} />;

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
            <InputArea message={typedMessage} setMessage={setTypedMessage} mediaUpload={handleMediaUpload} sendMessage={handleSendMessage} handleLogout={handleLogout}/>
          </div>
        );

      default:
          return <h2>Unknown State.</h2>;
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