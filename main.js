const APP_ID = "086f4dec9ce046a8bf849399aa06cd08";
const TOKEN = "007eJxTYFC5X93Pf2R1vLk169VLWmf1U12vCNx/0yfUGfbg38GlCzUUGFLTjEySjIySE82TTU3MjFItklITUy1SzRJNzA0MTIwsTy9nSmsIZGS4msrHwsgAgSA+E4OrCQMDAClpHos=";
const CHANNEL = "E4";

const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });

let localTracks = [];
let remoteUsers = {};


document.addEventListener("DOMContentLoaded", function() {
    var joinBtn = document.getElementById("join-btn");
    var doorIcon = document.querySelector(".fa-door-open");
    var join_container = document.querySelector(".join-container");

    joinBtn.addEventListener("click", function() {
        // Cacher le bouton Join stream
        joinBtn.style.display = "none";
        // Cacher l'icône de la porte
        doorIcon.style.display = "none";
        join_container.style.display = "none";
    });
});

let joinAndDisplayLocalStream = async () => {
    client.on('user-published', handleUserJoined);
    client.on('user-left', handleUserLeft);

    let UID = await client.join(APP_ID, CHANNEL, TOKEN, null);
    localTracks = await AgoraRTC.createMicrophoneAndCameraTracks();

    let player = `<div class="video-container" id="user-container-${UID}">
                        <div class="video-player" id="user-${UID}"></div>
                  </div>`;
    document.getElementById('video-streams').insertAdjacentHTML('beforeend', player);
    localTracks[1].play(`user-${UID}`);
    await client.publish([localTracks[0], localTracks[1]]);
};

let joinStream = async () => {
    await joinAndDisplayLocalStream();
    document.getElementById('join-btn').style.display = 'none';
    document.getElementById('stream-controls').style.display = 'flex';
};

let handleUserJoined = async (user, mediaType) => {
    remoteUsers[user.uid] = user;
    await client.subscribe(user, mediaType);

    if (mediaType === 'video') {
        let player = document.getElementById(`user-container-${user.uid}`);
        if (player != null) {
            player.remove();
        }

        player = `<div class="video-container" id="user-container-${user.uid}">
                      <div class="video-player" id="user-${user.uid}"></div> 
                  </div>`;
        document.getElementById('video-streams').insertAdjacentHTML('beforeend', player);
        user.videoTrack.play(`user-${user.uid}`);
    }

    if (mediaType === 'audio') {
        user.audioTrack.play();
    }
};

let handleUserLeft = async (user) => {
    delete remoteUsers[user.uid];
    document.getElementById(`user-container-${user.uid}`).remove();
};

let leaveAndRemoveLocalStream = async () => {
    for (let i = 0; localTracks.length > i; i++) {
        localTracks[i].stop();
        localTracks[i].close();
    }

    await client.leave();
    document.getElementById('join-btn').style.display = 'block';
    document.getElementById('stream-controls').style.display = 'none';
    document.getElementById('video-streams').innerHTML = '';
};

let toggleMic = async (e) => {
    if (localTracks[0].muted) {
        await localTracks[0].setMuted(false);
        e.target.innerText = 'Mic on';
        e.target.style.backgroundColor = 'cadetblue';
    } else {
        await localTracks[0].setMuted(true);
        e.target.innerText = 'Mic off';
        e.target.style.backgroundColor = '#EE4B2B';
    }
};

let toggleCamera = async (e) => {
    if (localTracks[1].muted) {
        await localTracks[1].setMuted(false);
        e.target.innerText = 'Camera on';
        e.target.style.backgroundColor = 'cadetblue';
    } else {
        await localTracks[1].setMuted(true);
        e.target.innerText = 'Camera off';
        e.target.style.backgroundColor = '#EE4B2B';
    }
};

document.getElementById('join-btn').addEventListener('click', joinStream);
document.getElementById('leave-btn').addEventListener('click', leaveAndRemoveLocalStream);
document.getElementById('mic-btn').addEventListener('click', toggleMic);
document.getElementById('camera-btn').addEventListener('click', toggleCamera);

// Encryption and Decryption Functions
async function generateKey() {
    return await window.crypto.subtle.generateKey(
        {
            name: "AES-GCM",
            length: 256,
        },
        true,
        ["encrypt", "decrypt"]
    );
}

async function encryptData(plainText, key) {
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(plainText);

    const encryptedData = await window.crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        key,
        encoded
    );

    return { encryptedData, iv };
}

async function decryptData(encryptedData, iv, key) {
    const decryptedData = await window.crypto.subtle.decrypt(
        { name: "AES-GCM", iv },
        key,
        encryptedData
    );
    const decodedData = new TextDecoder().decode(decryptedData);

    return decodedData;
}

// Gestionnaires d'événements pour les boutons, etc.
document.getElementById('encrypt-btn').addEventListener('click', () => {
    const encryptButton = document.getElementById('encrypt-btn');
    let message;

    if (encryptButton.innerText.includes('Off')) {
        // Activer le chiffrement
        encryptButton.innerText = 'Encrypt On';
        encryptButton.style.backgroundColor = 'cadetblue';
        message = 'Encryption enabled';
    } else {
        // Désactiver le chiffrement
        encryptButton.innerText = 'Encrypt Off';
        encryptButton.style.backgroundColor = '#EE4B2B';
        message = 'Encryption disabled';
    }

    // Envoyer l'état du chiffrement au serveur
    sendMessageToServer(message);
});

