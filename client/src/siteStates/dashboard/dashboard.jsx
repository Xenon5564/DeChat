import React from "react";

import Chat from '../../components/Chat/chat';
import './dashboard.css';

function Dashboard({avatar, channels, currentRoom, unreadChannels, socket, switchRoom, messageListRef, messages, scrollToBottom, onlineUsers, typedMessage, setTypedMessage, handleMediaUpload, handleSendMessage, handleLogout, CryptoEngine}) {
    return (
        <div id="dashboard">
            <div id="sideContainer">
                <div id="serverSidebar">
                    <button className="btn-roundButton" id="placeholder"> holder </button>
                    <button className="btn-roundButton" id="addServer"> + </button>
                </div>

                <label htmlFor="settingsBtn" id="settingsLabel"> <img src={avatar} className="avatar-preview-img" alt="Preview" /></label>
                <button id="settingsBtn" style={{ display: 'none' }} />
            </div>

            <div id="chatArea">
                <Chat channels={channels} currentRoom={currentRoom} unreadChannels={unreadChannels} socket={socket} switchRoom={switchRoom} messageListRef={messageListRef} messages={messages} scrollToBottom={scrollToBottom} onlineUsers={onlineUsers} typedMessage={typedMessage} setTypedMessage={setTypedMessage} handleMediaUpload={handleMediaUpload} handleSendMessage={handleSendMessage} handleLogout={handleLogout} CryptoEngine={CryptoEngine} />
            </div>
        </div>
    );
}

export default Dashboard;