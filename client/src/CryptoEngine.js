export const CryptoEngine = {
    keyPair: null,

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