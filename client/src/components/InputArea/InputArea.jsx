import React from "react";
import './InputArea.css'

function InputArea({message, setMessage, mediaUpload, sendMessage, handleLogout}) {
    return(
        <div id="inputArea">
            <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage}
                placeholder="Type a message..."
                id="messageContent"
            />
            <label htmlFor="attachmentInput" id="attachmentBtn">🖼️</label>
            <input
                type="file"
                id="attachmentInput"
                onChange={mediaUpload}
                style={{display: 'none'}}
            />
            <button id="sendBtn" onClick={sendMessage}>Send</button>
            <button id="disconnectBtn" onClick={() => handleLogout()}>Disconnect</button>
        </div>
    )
}

export default InputArea;