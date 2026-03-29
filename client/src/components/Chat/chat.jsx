import React from "react";
import { useChat } from "../../contexts/chatContext";
import { CryptoEngine } from "../../CryptoEngine";

import UserList from "./UserList/Userlist";
import ChannelList from "./Channellist/Channellist";
import Message from "./Message/Message";
import InputArea from "./InputArea/InputArea";

function Chat() {
    const { messages, messageListRef, scrollToBottom } = useChat();
    return (
        <div id="chatPage">
            <div id="chatBody">
              <ChannelList />
              <div id="messageContainer">
                <div id="messageList" ref={messageListRef}>
                  {messages.map((msg, idx) => (
                    <Message key={idx} msg={msg} onMediaLoad={scrollToBottom} />
                  ))}
                </div>
              </div>
              <UserList /> 
            </div>
            <InputArea />
        </div>
    );
}

export default Chat;