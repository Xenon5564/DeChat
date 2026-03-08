import React from 'react';

function UserList({ users, myKey }) {
    return (
        <div id="userListContainer">
            <h3>Online users:</h3>
            <ul id="userList">
                {users.map((user) => (
                    <li key={user.publicKey}>
                        {user.username}#{user.tag}
                        {user.publicKey === myKey && " (You)"}
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default UserList;