// --- CONFIGURAZIONE E INIZIALIZZAZIONE FIREBASE ---
// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDXpH-0R_9mZu3BsNLeXhLTp1kODCNgPgw",
  authDomain: "backtoto.firebaseapp.com",
  projectId: "backtoto",
  storageBucket: "backtoto.firebasestorage.app",
  messagingSenderId: "625307831560",
  appId: "1:625307831560:web:db022bc7819f08d28bb0bd"
};

// Inizializza Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Funzione che viene attivata quando si clicca su [ + ]
function joinEvent(eventId) {
    const name = prompt("Inserisci il tuo nome per unirti all'attività:");
    
    if (name && name.trim() !== "") {
        const cleanName = name.trim().toUpperCase();
        
        // Salviamo il nome nel database sotto il percorso 'eventi/id_evento/nome'
        database.ref('eventi/' + eventId).push(cleanName);
    }
}

// Restiamo in ascolto dei cambiamenti del database in tempo reale
database.ref('eventi').on('value', (snapshot) => {
    const data = snapshot.val() || {};
    
    // Resettiamo prima tutti i contenitori grafici dei partecipanti
    document.querySelectorAll('.participants').forEach(el => el.innerText = "");
    
    // Cicliamo tra gli eventi che hanno ricevuto adesioni
    Object.keys(data).forEach(eventId => {
        const participantsObject = data[eventId];
        // Estraiamo i nomi dall'oggetto di Firebase e li uniamo con una virgola
        const namesArray = Object.values(participantsObject);
        const participantsText = "PARTECIPANTI: " + namesArray.join(', ');
        
        // Iniettiamo i nomi nell'elemento HTML corretto
        const container = document.getElementById('parts-' + eventId);
        if (container) {
            container.innerText = participantsText;
        }
    });
});

// --- DA QUI IN POI SEGUE IL TUO VECCHIO CODICE (COUNTDOWN E MAPPA) ---

// --- CONFIGURAZIONE VIAGGIO ---
// Tappa 1: Volo Stoccolma - Trieste
const departureFlight = new Date('2026-05-23T09:50:00+02:00').getTime(); // Stoccolma
const arrivalFlight = new Date('2026-05-23T12:25:00+02:00').getTime();   // Trieste

// TEST TEMPORANEO - Ricordati di rimettere le date giuste dopo!
//const departureFlight = new Date('2026-05-22T10:00:00+02:00').getTime(); // Stamattina
//const arrivalFlight = new Date('2026-05-22T18:00:00+02:00').getTime();   // Stasera

// Tappa 2: Auto Trieste - Torino (Lo useremo dopo per la mappa)
const departureDrive = new Date('2026-05-24T10:00:00+02:00').getTime();
const arrivalDrive = new Date('2026-05-24T16:00:00+02:00').getTime(); // +6 ore

// --- FUNZIONE COUNTDOWN (Aggiornata per Ore Totali) ---
function updateCountdown() {
    const now = new Date().getTime();
    const targetTime = arrivalDrive; // Punta a Torino

    if (now > targetTime) {
        document.getElementById('timer').innerText = "00 : 00 : 00";
        return;
    }

    const distance = targetTime - now;

    // Calcolo ORE TOTALI (non sottraggo più i giorni)
    const totalHours = Math.floor(distance / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    // Aggiungo lo zero iniziale se il numero è a una sola cifra
    const formattedHours = totalHours.toString().padStart(2, '0');
    const formattedMinutes = minutes.toString().padStart(2, '0');
    const formattedSeconds = seconds.toString().padStart(2, '0');

    // Formattazione spaziosa in stile immagine: "19 : 20 : 58"
    const timeString = `${formattedHours} : ${formattedMinutes} : ${formattedSeconds}`;

    document.getElementById('timer').innerText = timeString;
}

// Aggiorna il countdown ogni secondo
setInterval(updateCountdown, 1000);
// Chiama subito la funzione per non far vedere i trattini per il primo secondo
updateCountdown();

// --- CONFIGURAZIONE MAPPA ---

// --- CONFIGURAZIONE MAPPA (Stilizzata, Statica e Senza Scritte) ---
const coords = {
    stockholm: [59.6519, 17.9186],
    trieste: [45.8275, 13.4722],
    torino: [45.0703, 7.6869]
};

// Inizializziamo la mappa DISABILITANDO tutte le interazioni (trascinamento, zoom, tastiera, ecc.)
const map = L.map('map', {
    zoomControl: false,          // Nasconde i tasti + e -
    dragging: false,           // Impedisce di trascinare la mappa
    scrollWheelZoom: false,    // Impedisce lo zoom con la rotella del mouse
    doubleClickZoom: false,    // Impedisce lo zoom con il doppio click
    boxZoom: false,            // Disabilita lo zoom a selezione
    keyboard: false,           // Disabilita i controlli da tastiera
    touchZoom: false,          // Disabilita lo zoom con le dita su smartphone
    attributionControl: false  // Rimuove la scritta Leaflet in basso a destra
}).setView([51.5, 12.0], 4);   // Centrata leggermente meglio per il blocco statico

// Usiamo la mappa "dark_nolabels": una mappa nera pura, senza nessuna scritta o linea superflua
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png', {
    maxZoom: 19
}).addTo(map);

// Creiamo un pin minimale (usiamo un cerchio colorato fisso invece dell'icona standard blu di Leaflet)
const myMarker = L.circleMarker(coords.stockholm, {
    radius: 6,
    fillColor: '#FFFFFF',      // Cerchio bianco minimale
    color: '#FFFFFF',
    weight: 1,
    opacity: 1,
    fillOpacity: 0.8
}).addTo(map);

// Linee del percorso sottili e grigie, quasi invisibili, in perfetto stile luxury
L.polyline([coords.stockholm, coords.trieste], {color: '#333333', dashArray: '4, 4', weight: 1.5}).addTo(map);
L.polyline([coords.trieste, coords.torino], {color: '#333333', dashArray: '4, 4', weight: 1.5}).addTo(map);

// --- FUNZIONE CALCOLO POSIZIONE (Interpolata) ---
function interpolateCoords(startCoord, endCoord, percentage) {
    const lat = startCoord[0] + (endCoord[0] - startCoord[0]) * percentage;
    const lng = startCoord[1] + (endCoord[1] - startCoord[1]) * percentage;
    return [lat, lng];
}

function updateMapPosition() {
    const now = new Date().getTime();
    const statusText = document.getElementById('travel-status');

    if (now < departureFlight) {
        myMarker.setLatLng(coords.stockholm);
        statusText.innerText = "Ancora a Stoccolma. Sto preparando i bagagli!";
        return;
    }

    if (now >= departureFlight && now <= arrivalFlight) {
        const totalDuration = arrivalFlight - departureFlight;
        const timeElapsed = now - departureFlight;
        const percentage = timeElapsed / totalDuration;
        const currentPos = interpolateCoords(coords.stockholm, coords.trieste, percentage);
        myMarker.setLatLng(currentPos);
        statusText.innerText = `In volo verso Trieste! Progresso: ${Math.round(percentage * 100)}%`;
        return;
    }

    if (now > arrivalFlight && now < departureDrive) {
        myMarker.setLatLng(coords.trieste);
        statusText.innerText = "Sono a Trieste. Mi riposo prima di guidare verso Torino.";
        return;
    }

    if (now >= departureDrive && now <= arrivalDrive) {
        const totalDuration = arrivalDrive - departureDrive;
        const timeElapsed = now - departureDrive;
        const percentage = timeElapsed / totalDuration;
        const currentPos = interpolateCoords(coords.trieste, coords.torino, percentage);
        myMarker.setLatLng(currentPos);
        statusText.innerText = `In macchina verso Torino! Progresso: ${Math.round(percentage * 100)}%`;
        return;
    }

    if (now > arrivalDrive) {
        myMarker.setLatLng(coords.torino);
        statusText.innerText = "Sono arrivato a Torino!";
        return;
    }
}

setInterval(updateMapPosition, 5000);
updateMapPosition();
