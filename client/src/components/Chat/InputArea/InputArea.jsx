import React from "react";
import { useChat } from '../../../contexts/chatContext';
import './InputArea.css'

function InputArea() {
    const { typedMessage, setTypedMessage, handleMediaUpload, handleSendMessage, handleLogout } = useChat(); 
    return(
        <div id="inputArea">
            <input
                type="text"
                value={typedMessage}
                onChange={(e) => setTypedMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Type a message..."
                id="messageContent"
            />
            <label htmlFor="attachmentInput" id="attachmentBtn">🖼️</label>
            <input
                type="file"
                id="attachmentInput"
                onChange={handleMediaUpload}
                style={{display: 'none'}}
            />
            <button className="btn-roundSquare" id="sendBtn" onClick={handleSendMessage}>Send</button>
            <button className="btn-roundSquare" id="disconnectBtn" onClick={() => handleLogout()}>Disconnect</button>
        </div>
    )
}

export default InputArea;