import React from 'react';
import { useChat } from '../../../contexts/chatContext';
import { CryptoEngine } from '../../../CryptoEngine';
import './Userlist.css'

function UserList() {
    const { onlineUsers } = useChat();
    const myKey = CryptoEngine.activeKeyPair?.publicKey;

    return (
        <div id="userListContainer">
            <h3>Online users — {onlineUsers.length}</h3>
            <ul id="userList">
                {onlineUsers.map((user) => (
                    <li key={user.publicKey} className="user-item">
                        <div className="user-item-layout">
                            <img src={user.avatar} className='user-list-avatar' alt="pfp" />

                            <span className="user-list-info">
                                <span className="username-text">{user.username}</span>
                                {user.publicKey === myKey && <span className="user-list-you">(You)</span>}
                            </span>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default UserList;