import React from "react";
import { useChat } from '../../contexts/chatContext';
import Chat from '../../components/Chat/chat';
import './dashboard.css';

function Dashboard() {
    const { avatar } = useChat();
    
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
                <Chat />
            </div>
        </div>
    );
}

export default Dashboard;