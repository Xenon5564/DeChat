const Identity = {
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
    }
};