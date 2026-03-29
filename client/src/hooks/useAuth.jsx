import { useState, useEffect } from "react";
import { CryptoEngine } from '../CryptoEngine';
import { DBHandler, DB_KEYS } from '../DBHandler';
import { processAvatar, generateAvatar } from '../utils/avatar';

export function useAuth() {
    const [loginState, setLoginState] = useState('CHECK');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [avatar, setAvatar] = useState(null);
    const [publicKey, setPublicKey] = useState('');

    useEffect(() => {
        checkForProfile();
    }, []);

    const checkForProfile = async () => {
        setUsername('');
        setPassword('');
        const profileExists = await DBHandler.has(DB_KEYS.PROFILE);
        setLoginState(profileExists ? 'UNLOCK' : 'NO_PROFILE');
        CryptoEngine.generateSignKeys();
    };

    const handleCreateProfile = async () => {
        if(!username.trim() || !password.trim()) {
            return alert("Username and Password are both required");
        }

        const salt = window.crypto.getRandomValues(new Uint8Array(16));
        const key = await CryptoEngine.deriveKey(password, salt);
        const signKeyPair = await CryptoEngine.generateSignKeys();
        
        let base64Avatar;

        if(avatar) {
            base64Avatar = processAvatar(avatar);
        } else {
            base64Avatar = generateAvatar(username);
        }

        const profileObj = { username: username, avatar: base64Avatar, signKeys: signKeyPair};
        const encryptedProfile = await CryptoEngine.encryptProfile(key, profileObj);

        await DBHandler.put(DB_KEYS.PROFILE, { profile: encryptedProfile, salt: salt});
        setUsername('');
        setPassword('');
        setAvatar(null);
        setLoginState('UNLOCK');
    };

    const handleUnlock = async () => {
        const encryptedProfile = await DBHandler.get(DB_KEYS.PROFILE);
        const aesKey = await CryptoEngine.deriveKey(password, encryptedProfile.salt);

        try {
            const decryptedProfile = await CryptoEngine.decryptProfile(
                aesKey,
                encryptedProfile.profile.iv,
                encryptedProfile.profile.ciphertext
            );

            CryptoEngine.importKeys(decryptedProfile.signKeys);
            setUsername(decryptedProfile.username);
            setPublicKey(JSON.stringify(decryptedProfile.signKeys.publicKey));
            setAvatar(decryptedProfile.avatar);
            setLoginState('DASHBOARD');
        } catch {
            alert('Wrong password');
        }
    }

    const handleLogout = () => {
        CryptoEngine.wipeSession();
        setLoginState('CHECK');
        checkForProfile();
    }

    return {
        loginState, setLoginState,
        username, setUsername,
        password, setPassword,
        avatar, setAvatar,
        publicKey,
        handleCreateProfile,
        handleUnlock,
        handleLogout
    };
}