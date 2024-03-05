async function generateKey() {
    return window.crypto.subtle.generateKey(
        {
            name: "AES-GCM",
            length: 256,
        },
        true,
        ["encrypt", "decrypt"]
    );
}

async function encryptMessage(key, message) {
    const encoder = new TextEncoder();
    const encodedMessage = encoder.encode(message);
    const iv = window.crypto.getRandomValues(new Uint8Array(12)); // Vecteur d'initialisation

    const encryptedContent = await window.crypto.subtle.encrypt(
        {
            name: "AES-GCM",
            iv: iv,
        },
        key,
        encodedMessage
    );

    return { encryptedContent, iv };
}

async function decryptMessage(key, encryptedContent, iv) {
    const decryptedContent = await window.crypto.subtle.decrypt(
        {
            name: "AES-GCM",
            iv: iv,
        },
        key,
        encryptedContent
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedContent);
}
