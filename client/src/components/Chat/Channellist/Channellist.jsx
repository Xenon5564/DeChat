import React from 'react';
import { useChat } from '../../../contexts/chatContext';
import './Channellist.css'

function ChannelList() {
    const { channels, currentRoom, unreadChannels, switchRoom, socket } = useChat();
    return (
        <div id="roomListContainer">
            <h3>Channels</h3>
            {channels.map((channel) => (
                <button
                    key={channel.id}
                    className={`room-btn 
                        ${currentRoom === channel.id ? 'active' : ''} 
                        ${unreadChannels[channel.id] ? 'unread' : ''}`
                    }
                    onClick={() => switchRoom(channel.id)}
                >
                    # {channel.name}
                </button>
            ))}
        </div>
    );
}

export default ChannelList;