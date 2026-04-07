import React from 'react';
import { useChat } from '../../../contexts/chatContext';
import { CryptoEngine } from '../../../CryptoEngine';
import './Userlist.css'

function UserList() {
    const { onlineUsers, knownUsers } = useChat();
    const myKey = CryptoEngine.activeKeyPair?.publicKey;

    const allUsers = Object.values(knownUsers).map(user => {
        const isOnline = onlineUsers.some(u => u.publicKey === user.publicKey);
        return { ...user, isOnline };
    }).sort((a, b) => {
        if (a.isOnline === b.isOnline) return a.username.localeCompare(b.username);
        return a.isOnline ? -1 : 1;
    });

    return (
        <div id="userListContainer">
            <h3>Users — {allUsers.length}</h3>
            <ul id="userList">
                {allUsers.map((user) => (
                    <li key={user.publicKey} className={`user-item ${user.isOnline ? 'online' : 'offline'}`}>
                        <div className="user-item-layout">
                            <div className="avatar-container">
                                <img src={user.avatar} className='user-list-avatar' alt="pfp" />
                                <div className={`status-dot ${user.isOnline ? 'online' : 'offline'}`} />
                            </div>

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