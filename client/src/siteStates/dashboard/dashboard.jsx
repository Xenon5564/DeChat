import React from "react";

import Chat from '../../components/Chat/chat';
import './dashboard.css';

function Dashboard({channels, currentRoom, unreadChannels, socket, switchRoom, messageListRef, messages, scrollToBottom, onlineUsers, typedMessage, setTypedMessage, handleMediaUpload, handleSendMessage, handleLogout, CryptoEngine}) {
    return (
        <div id="dashboard">
            <div id="serverSidebar">
                <button className="btn-roundButton" id="placeholder"> holder </button>
                <button className="btn-roundButton" id="addServer"> + </button>
                <button className="btn-roundButton" id="Settings"> S </button>
            </div>

            <div id="chatArea">
                <Chat channels={channels} currentRoom={currentRoom} unreadChannels={unreadChannels} socket={socket} switchRoom={switchRoom} messageListRef={messageListRef} messages={messages} scrollToBottom={scrollToBottom} onlineUsers={onlineUsers} typedMessage={typedMessage} setTypedMessage={setTypedMessage} handleMediaUpload={handleMediaUpload} handleSendMessage={handleSendMessage} handleLogout={handleLogout} CryptoEngine={CryptoEngine} />
            </div>
        </div>
    );
}

export default Dashboard;