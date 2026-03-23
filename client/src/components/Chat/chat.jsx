import React from "react";

import UserList from "./UserList/Userlist";
import ChannelList from "./Channellist/Channellist";
import Message from "./Message/Message";
import InputArea from "./InputArea/InputArea";
import './chat.css';

function Chat({channels, currentRoom, unreadChannels, socket, switchRoom, messageListRef, messages, scrollToBottom, onlineUsers, typedMessage, setTypedMessage, handleMediaUpload, handleSendMessage, handleLogout, CryptoEngine}) {
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
              <UserList users={onlineUsers} myKey={CryptoEngine.activeKeyPair.public} /> 
            </div>
            <InputArea message={typedMessage} setMessage={setTypedMessage} mediaUpload={handleMediaUpload} sendMessage={handleSendMessage} handleLogout={handleLogout}/>
        </div>
    );
}

export default Chat;