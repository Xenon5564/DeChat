import React from 'react';

function ChannelList({ channels, currentRoom, unreadChannels, onSwitch}) {
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
                    onClick={() => onSwitch(channel.id)}
                >
                    # {channel.name}
                </button>
            ))}
        </div>
    );
}

export default ChannelList;