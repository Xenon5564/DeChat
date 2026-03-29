import React from "react";
import './register.css';

function register({username, setUsername, password, setPassword, avatar, setAvatar, handleCreateProfile, setLoginState}) {
    
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (avatar) URL.revokeObjectURL(avatar);

            const url = URL.createObjectURL(file);
            setAvatar(url);
        }
    }

    return(
        <div id="registerPage">
            <h2>Create Your Profile</h2>
            <p style={{ fontSize: '0.8em', color: '#888' }}>
                Your password encrypts your local profile file, If you lose the password, you will irreversably lose this account.
            </p>

            <div id="inputs">
                <div id="textInputs">
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
                </div>

                <label htmlFor="avatar" id="avatarInput">
                    {avatar ? (
                        <img src={avatar} className="avatar-preview-img" alt="Preview" />
                    ) : (
                        <div className="upload-placeholder">Click to upload photo</div>
                    )}
                </label>

                <input
                    id="avatar"
                    type="file" 
                    accept="image/*"
                    onChange={handleFileChange}
                    style={{ display: 'none' }} 
                />
            </div>

            <button className="btn-roundSquare" id="registerBtn" onClick={handleCreateProfile}> Generate & Encrypt Profile</button>
            <button className="btn-roundSquare" id="cancelBtn" onClick={() => setLoginState('NO_PROFILE')}>
                Cancel
            </button>
        </div>
    )
}

export default register;
