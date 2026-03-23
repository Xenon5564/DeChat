import React from "react";
import './register.css';

function register({username, setUsername, password, setPassword, handleCreateProfile, setLoginState}) {
    return(
        <div id="registerPage">
            <h2>Create Your Profile</h2>
            <p style={{ fontSize: '0.8em', color: '#888' }}>
                Your password encrypts your local profile file, If you lose the password, you will irreversably lose this account.
            </p>

            <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Choose a username..."
            />

            <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Choose a password..."
            />

              <button className="btn-roundSquare" id="registerBtn" onClick={handleCreateProfile}> Generate & Encrypt Profile</button>
              <button className="btn-roundSquare" id="cancelBtn" onClick={() => setLoginState('NO_PROFILE')}>
                Cancel
              </button>
        </div>
    )
}

export default register;
