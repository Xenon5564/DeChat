export const Identity = {
    keyPair: null,

    async loadOrCreate() {
        const storedPublicKey = localStorage.getItem('publicKey');
        const storedPrivateKey = localStorage.getItem('privateKey');

        if (storedPublicKey && storedPrivateKey) {
            console.log('Loading existing identity from localStorage');
            this.keyPair = {
                publicKey: await this.importKey(storedPublicKey, 'verify'),
                privateKey: await this.importKey(storedPrivateKey, 'sign')
            };
        } else {
            console.log('No existing identity found, creating new one');
            await this.generate();
        }

        return this.keyPair;
    },

    async generate() {
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

        this.keyPair = keyPair;

        const exportedPublicKey = await window.crypto.subtle.exportKey("jwk", keyPair.publicKey);
        const exportedPrivateKey = await window.crypto.subtle.exportKey("jwk", keyPair.privateKey);

        localStorage.setItem('publicKey', JSON.stringify(exportedPublicKey));
        localStorage.setItem('privateKey', JSON.stringify(exportedPrivateKey));

        console.log('New identity generated and stored in localStorage');
    },

    async importKey(jsonString, usage) {
        const keyData = JSON.parse(jsonString);
        return await window.crypto.subtle.importKey(
            "jwk",
            keyData,
            {
                name: "RSA-PSS",
                hash: "SHA-256"
            },
            true,
            [usage]
        );
    },

    async sign(text) {
        const encoder = new TextEncoder();
        const data = encoder.encode(text);
        
        const signatureBuffer = await window.crypto.subtle.sign(
            { name: "RSA-PSS", saltLength: 32 },
            this.keyPair.privateKey,
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
    }
};