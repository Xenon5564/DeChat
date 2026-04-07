import { useState, useEffect, useRef } from 'react';
import { CryptoEngine } from '../CryptoEngine';

export function useChat(socket, username) {
    const [messages, setMessages] = useState([]);
    const [channels, setChannels] = useState([]);
    const [currentRoom, setCurrentRoom] = useState('');
    const [unreadChannels, setUnreadChannels] = useState({});
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [knownUsers, setKnownUsers] = useState({});
    const [typedMessage, setTypedMessage] = useState('');

    const messageListRef = useRef(null);
    const currentRoomRef = useRef(currentRoom);

    // Keep track of which channel is the user viewing.
    useEffect(() => {   
        currentRoomRef.current = currentRoom;
    }, [currentRoom]);

    // Scroll down to new messages
    useEffect(() => {
        if(messageListRef.current) {
            messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
        }
    }, [messages]);

    useEffect(() => {
        setMessages([]);
        setChannels([]);
        setOnlineUsers([]);
        setKnownUsers({});
        setCurrentRoom('');
    }, [socket]);

    useEffect(() => {
        if (!socket) return;
        
        // Request initial data from the already-connected background socket
        socket.emit('request channel list');
        socket.emit('request user list');
        socket.emit('request known users');

        socket.on('channel list', (chans) => {
            console.log("Received channel list", chans);
            setChannels(chans);
            if (chans.length > 0) switchRoom(chans[0].id, socket);
        });

        socket.on('user list', (users) => {
            console.log("Received user list", users);
            setOnlineUsers(users);
        });

        socket.on('known users', (users) => {
            console.log("Received known users", users);
            setKnownUsers(users);
        });

        socket.on('chat message', (msg) => {
            if (msg.roomId === currentRoomRef.current || msg.username === 'System') {
                setMessages((prev) => [...prev, msg]);
            } else {
                setUnreadChannels((prev) => ({ ...prev, [msg.roomId]: true }));
            }
        });

        socket.on('join error', (err) => {
            alert(err);
        });

        socket.on('chat history', (history) => {
            console.log("Received history", history);
            setMessages(history);
        });

        // Request initial data AFTER setting up listeners
        socket.emit('request channel list');
        socket.emit('request user list');
        socket.emit('request known users');

        return () => {
            socket.off('channel list');
            socket.off('user list');
            socket.off('known users');
            socket.off('chat message');
            socket.off('join error');
            socket.off('chat history');
        };
    }, [socket]);

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

    const scrollToBottom = () => {
        if (messageListRef.current) {
            messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
        }
    };

  return {
    messages,
    channels, 
    currentRoom, 
    unreadChannels,
    onlineUsers,
    knownUsers,
    typedMessage, setTypedMessage,
    messageListRef,
    switchRoom,
    handleSendMessage,
    handleMediaUpload,
    scrollToBottom,
  }
}
