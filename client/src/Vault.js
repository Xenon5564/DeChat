export const Vault = {
    _encode(text) {
        return new TextEncoder().encode(text);
    },

    _decode(bytes) {
        return new TextDecoder().decode(bytes);
    },

    async deriveKey(password, salt) {
        const baseKey = await window.crypto.subtle.importKey(
            'raw',
            this._encode(password),
            { name: 'PBKDF2' },
            false,
            ['deriveKey']
        );

        const aesKey = await window.crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: salt,
                iterations: 100000,
                hash: 'SHA-256'
            },
            baseKey,
            { name: 'AES-GCM', length: 256 }, 
            false, 
            ['encrypt', 'decrypt']
        );

        return aesKey;
    },

    async encryptProfile(aesKey, profileObj){  
        const profileString = JSON.stringify(profileObj);
        const profileBytes = this._encode(profileString);

        const iv = window.crypto.getRandomValues(new Uint8Array(12));

        const encryptedProfile = await window.crypto.subtle.encrypt(
            { name: "AES-GCM", iv: iv },
            aesKey,
            profileBytes
        );

        return { ciphertext: encryptedProfile, iv: iv};
    },

    async decryptProfile(aesKey, iv, ciphertext){
        const profileBytes = await window.crypto.subtle.decrypt(
            { name: "AES-GCM", iv: iv },
            aesKey,
            ciphertext
        )

        const profileJSON = this._decode(profileBytes);
        const profileObj = JSON.parse(profileJSON);

        return profileObj;
    }
};