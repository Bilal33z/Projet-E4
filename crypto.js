// Obtenir les éléments vidéo du DOM
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');

let localStream;
let peerConnection;

const configuration = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

// Démarrer le flux vidéo local
async function startLocalVideo() {
    try {
        localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localVideo.srcObject = localStream;
    } catch (error) {
        console.error('Erreur lors de l’accès aux médias : ', error);
    }
}

// Initialiser la connexion Peer-to-Peer
function createPeerConnection() {
    peerConnection = new RTCPeerConnection(configuration);

    // Ajouter les pistes locales à la connexion
    localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
    });

    // Écouter les pistes distantes
    peerConnection.ontrack = event => {
        if (!remoteVideo.srcObject) {
            remoteVideo.srcObject = event.streams[0];
        }
    };

    // Gestion des candidats ICE
    peerConnection.onicecandidate = event => {
        if (event.candidate) {
            console.log('Nouveau candidat ICE:', event.candidate);
            // Ici, vous devriez envoyer le candidat ICE au pair distant via votre serveur de signalisation
        }
    };

    peerConnection.oniceconnectionstatechange = () => {
        console.log('ICE Connection State Change:', peerConnection.iceConnectionState);
    };
}

// Créer une offre et l'envoyer au pair distant
async function createOffer() {
    try {
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        console.log('Offre créée et définie comme description locale:', offer);
        // Ici, vous devriez envoyer l'offre au pair distant via votre serveur de signalisation
    } catch (error) {
        console.error('Erreur lors de la création de l’offre :', error);
    }
}

// Définir la réponse reçue du pair distant comme description distante
async function setRemoteDescription(sdp) {
    try {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(sdp));
        console.log('Description distante définie avec succès.');
    } catch (error) {
        console.error('Erreur lors de la définition de la description distante:', error);
    }
}

// Créer une réponse à une offre reçue et l'envoyer au pair distant
async function createAnswer() {
    try {
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        console.log('Réponse créée et définie comme description locale:', answer);
        // Ici, vous devriez envoyer la réponse au pair distant via votre serveur de signalisation
    } catch (error) {
        console.error('Erreur lors de la création de la réponse:', error);
    }
}

// Ajouter un candidat ICE reçu du pair distant
function addIceCandidate(candidate) {
    peerConnection.addIceCandidate(new RTCIceCandidate(candidate))
        .then(() => console.log('Candidat ICE ajouté avec succès à la connexion.'))
        .catch(error => console.error('Erreur lors de l’ajout du candidat ICE:', error));
}

// Démarrer la vidéo locale et initialiser la connexion peer-to-peer au démarrage
startLocalVideo().then(() => {
    createPeerConnection();
});

// Fonctions pour l'exemple de hachage SHA-256
async function hashMessage(message) {
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);

    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

async function testHashing() {
    const message = 'Ceci est un message secret';
    const hash = await hashMessage(message);
    console.log('Empreinte SHA-256 du message:', hash);
}

testHashing(); // Test du hachage SHA-256

