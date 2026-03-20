export const CryptoEngine = {
    activeKeyPair: null,

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
    }
};