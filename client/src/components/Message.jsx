import React from 'react';
import embedProviders from '../utils/embedProviders';

function Message({ idx, msg, onMediaLoad }) {
  // 1. Handle Timestamp Logic here
  const date = new Date(msg.timestamp || Date.now());
  const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

  function renderContent(msg) {
    if (msg.type === 'media') { 
        // Image?
        return (
            msg.content.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? (
                <img src={msg.content} className='chat-media' alt="upload" onLoad={onMediaLoad} />
        ) : 
        // Video?
        msg.content.match(/\.(mp4|webm|mkv)$/i) ? (
            <video src={msg.content} className='chat-media' controls  onLoad={onMediaLoad} />
        ) : 
        // Audio?
        msg.content.match(/\.(mp3|wav|ogg|m4a)$/i) ? (
            <audio src={msg.content} controls className="chat-audio" onLoad={onMediaLoad} />
        ) : (
        // Fallback 
            <a href={msg.content} target="_blank" rel="noreferrer" className="chat-file-link"  onLoad={onMediaLoad} >
                📎 Download File {msg.content}
            </a>
        )
    )}
    
    if (msg.type === 'text') {
        for (const provider of embedProviders) {
            const match = msg.content.match(provider.regex);
            if (match) {
                return (
                    <div>
                        {provider.render(match)}
                    </div>
                );
            }
        }
        return <span>{msg.content}</span>;
        }
    }

  return (
        <div key={idx} className="message-bubble">
            <strong>{msg.username}: </strong>
            {renderContent(msg)}
        </div>
  );
}

export default Message;