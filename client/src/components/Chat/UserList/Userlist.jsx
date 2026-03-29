import React from 'react';
import './Userlist.css'

function UserList({ users, myKey }) {
    return (
        <div id="userListContainer">
            <h3>Online users — {users.length}</h3>
            <ul id="userList">
                {users.map((user) => (
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