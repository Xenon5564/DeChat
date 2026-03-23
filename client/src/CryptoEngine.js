export const CryptoEngine = {
    activeKeyPair: null,

    _encode(text) {
        return new TextEncoder().encode(text);
    },

    _decode(bytes) {
        return new TextDecoder().decode(bytes);
    },

    async sign(text) {
        const encoder = new TextEncoder();
        const data = encoder.encode(text);
        
        const signatureBuffer = await window.crypto.subtle.sign(
            { name: "RSA-PSS", saltLength: 32 },
            this.activeKeyPair.privateKey,
            data
        );
        
        const hashArray = Array.from(new Uint8Array(signatureBuffer));
        const hashString = hashArray.map(b => String.fromCharCode(b)).join('');
        return btoa(hashString); 
    },
        
    async verify(text, signatureBase64, publicKeyObject) {
        const encoder = new TextEncoder();
        const data = encoder.encode(text);

        const signature = Uint8Array.from(atob(signatureBase64), c => c.charCodeAt(0));

        return await window.crypto.subtle.verify(
            {
                name: "RSA-PSS",
                saltLength: 32
            },
            publicKeyObject,
            signature,
            data
        );
    },

    async generateSignKeys() {
        const keyPair = await window.crypto.subtle.generateKey(
            {
                name: "RSA-PSS",
                modulusLength: 2048,
                publicExponent: new Uint8Array([1, 0, 1]),
                hash: "SHA-256"
            },
            true,
            ["sign", "verify"]
        );

        this.activeKeyPair = keyPair;

        const publicKeyJSON = await window.crypto.subtle.exportKey("jwk", keyPair.publicKey);
        const privateKeyJSON = await window.crypto.subtle.exportKey("jwk", keyPair.privateKey);

        return { publicKey: publicKeyJSON, privateKey: privateKeyJSON };
    },

    async importKeys(keyPairStrings) {
        const privateKeyObject = await window.crypto.subtle.importKey(
            "jwk",                  
            keyPairStrings.privateKey, 
            { name: "RSA-PSS", hash: "SHA-256" },
            true,                   
            ["sign"]    
        );

        const publicKeyObject = await window.crypto.subtle.importKey(
            "jwk",                  
            keyPairStrings.publicKey,  
            { name: "RSA-PSS", hash: "SHA-256" },
            true,                   
            ["verify"]            
        );

        this.activeKeyPair = {
            privateKey: privateKeyObject,
            publicKey: publicKeyObject
        };
    },

    async wipeSession() {
        this.activeKeyPair = null;
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