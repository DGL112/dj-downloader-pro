// --------- Waveform Player and Hot Cue System ---------

// Global variables
let audioContext;
let audioBuffer;
let isPlaying = false;
let hotCues = [];
let bpmValue = 0;

// DOM elements
const audioPlayer = document.getElementById('audio-player');
const playPauseBtn = document.getElementById('play-pause-btn');
const currentTimeDisplay = document.getElementById('current-time');
const totalTimeDisplay = document.getElementById('total-time');
const waveformContainer = document.getElementById('waveform');
const beatGridContainer = document.getElementById('beat-grid');
const hotCuesContainer = document.getElementById('hot-cues-container');
const playhead = document.getElementById('playhead');
const addCueBtn = document.getElementById('add-cue-btn');
const exportCuesBtn = document.getElementById('export-cues-btn');
const hotCuesList = document.getElementById('hot-cues-list');
const downloadMp3Btn = document.getElementById('download-mp3-btn');
const playerSection = document.getElementById('player-section');

// Create waveform canvas
const waveformCanvas = document.createElement('canvas');
waveformCanvas.id = 'waveform-canvas';
waveformContainer.appendChild(waveformCanvas);
const waveformCtx = waveformCanvas.getContext('2d');

// Attach persistent event listeners (once, outside of initPlayer)
playPauseBtn.addEventListener('click', togglePlayPause);
addCueBtn.addEventListener('click', () => {
    createHotCue(audioPlayer.currentTime);
});
exportCuesBtn.addEventListener('click', exportCuesToRekordbox);
waveformContainer.addEventListener('click', (e) => {
    if (!audioBuffer) return;
    const rect = waveformContainer.getBoundingClientRect();
    const clickPosition = (e.clientX - rect.left) / rect.width;
    const seekTime = clickPosition * audioBuffer.duration;
    audioPlayer.currentTime = seekTime;
    updatePlayhead();
});

// ### Helper Functions

// Initialize the AudioContext
function initAudioContext() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
}

// Format time in MM:SS
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

// Draw the waveform visualization
function drawWaveform(buffer) {
    const width = waveformCanvas.width;
    const height = waveformCanvas.height;
    const channelData = buffer.getChannelData(0);
    const step = Math.ceil(channelData.length / width);

    waveformCtx.clearRect(0, 0, width, height);
    waveformCtx.fillStyle = '#3498db';

    for (let i = 0; i < width; i++) {
        const start = Math.floor(i * step);
        const end = Math.floor((i + 1) * step);
        let min = channelData[start];
        let max = channelData[start];

        for (let j = start; j < end; j++) {
            if (channelData[j] < min) min = channelData[j];
            if (channelData[j] > max) max = channelData[j];
        }

        const y = height / 2;
        const amplitude = Math.max(Math.abs(min), Math.abs(max));

        const gradient = waveformCtx.createLinearGradient(0, y - height / 2 * amplitude, 0, y + height / 2 * amplitude);
        gradient.addColorStop(0, 'rgba(52, 152, 219, 0.8)');
        gradient.addColorStop(0.5, 'rgba(52, 152, 219, 0.5)');
        gradient.addColorStop(1, 'rgba(52, 152, 219, 0.8)');

        waveformCtx.fillStyle = gradient;
        waveformCtx.fillRect(i, y - height / 2 * amplitude, 1, height * amplitude);
    }
}

// Draw the beat grid based on BPM
function drawBeatGrid(bpm, duration) {
    beatGridContainer.innerHTML = '';

    if (!bpm || bpm <= 0) return;

    const beatsPerSecond = bpm / 60;
    const totalBeats = beatsPerSecond * duration;

    for (let i = 0; i < totalBeats; i++) {
        const beatMarker = document.createElement('div');
        beatMarker.className = 'beat-marker';
        const beatTime = i / beatsPerSecond;
        const position = (beatTime / duration) * 100;
        beatMarker.style.left = `${position}%`;

        if (i % 4 === 0) {
            beatMarker.style.backgroundColor = 'rgba(255, 255, 255, 0.4)';
            beatMarker.style.width = '2px';
        }

        beatGridContainer.appendChild(beatMarker);
    }
}

// Create a hot cue
function createHotCue(time, name) {
    const cueId = Date.now();
    const cue = { id: cueId, time, name: name || `Cue ${hotCues.length + 1}` };
    hotCues.push(cue);
    drawHotCueMarker(cue);
    updateHotCuesList();
    return cue;
}

// Draw a hot cue marker on the waveform
function drawHotCueMarker(cue) {
    const duration = audioBuffer.duration;
    const position = (cue.time / duration) * 100;
    const marker = document.createElement('div');
    marker.className = 'hot-cue-marker';
    marker.setAttribute('data-cue', cue.name);
    marker.setAttribute('data-id', cue.id);
    marker.style.left = `${position}%`;
    hotCuesContainer.appendChild(marker);
}

// Redraw all hot cue markers (e.g., on resize)
function redrawHotCueMarkers() {
    hotCuesContainer.innerHTML = '';
    hotCues.forEach(cue => drawHotCueMarker(cue));
}

// Update the hot cues list in the UI
function updateHotCuesList() {
    hotCuesList.innerHTML = '';
    hotCues.forEach(cue => {
        const cueItem = document.createElement('div');
        cueItem.className = 'cue-item';
        cueItem.setAttribute('data-id', cue.id);
        cueItem.innerHTML = `
            <div class="cue-name">${cue.name}</div>
            <div class="cue-time">${formatTime(cue.time)}</div>
            <div class="cue-actions">
                <button class="jump-to-cue" title="Jump to cue">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                </button>
                <button class="delete-cue" title="Delete cue">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
        `;
        cueItem.querySelector('.jump-to-cue').addEventListener('click', () => jumpToCue(cue.id));
        cueItem.querySelector('.delete-cue').addEventListener('click', () => deleteCue(cue.id));
        hotCuesList.appendChild(cueItem);
    });
}

// Jump to a specific cue point
function jumpToCue(cueId) {
    const cue = hotCues.find(c => c.id === cueId);
    if (cue) {
        audioPlayer.currentTime = cue.time;
        updatePlayhead();
    }
}

// Delete a cue
function deleteCue(cueId) {
    hotCues = hotCues.filter(cue => cue.id !== cueId);
    updateHotCuesList();
    redrawHotCueMarkers();
}

// Update the playhead position
function updatePlayhead() {
    if (!audioBuffer) return;
    const duration = audioBuffer.duration;
    const currentTime = audioPlayer.currentTime;
    const position = (currentTime / duration) * 100;
    playhead.style.left = `${position}%`;
    currentTimeDisplay.textContent = formatTime(currentTime);
}

// Export hot cues to Rekordbox XML format
function exportCuesToRekordbox() {
    if (hotCues.length === 0) {
        alert('No hot cues to export!');
        return;
    }
    const artist = document.getElementById('r-artist').textContent;
    const title = document.getElementById('r-title').textContent;
    const key = document.getElementById('r-key').textContent;
    const bpm = document.getElementById('r-bpm').textContent;
    let xmlContent = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xmlContent += '<DJ_PLAYLISTS Version="1.0.0">\n';
    xmlContent += '  <PRODUCT Name="rekordbox" Version="6.0.0" Company="Pioneer DJ"/>\n';
    xmlContent += '  <COLLECTION Entries="1">\n';
    xmlContent += `    <TRACK Artist="${artist}" Title="${title}" Kind="MP3 File" BPM="${bpm}" Key="${key}" TotalTime="${formatTime(audioBuffer.duration)}">\n`;
    hotCues.forEach(cue => {
        const timeMs = Math.floor(cue.time * 1000);
        xmlContent += `      <POSITION_MARK Name="${cue.name}" Type="0" Start="${timeMs}" Num="0"/>\n`;
    });
    xmlContent += '    </TRACK>\n';
    xmlContent += '  </COLLECTION>\n';
    xmlContent += '</DJ_PLAYLISTS>';
    const blob = new Blob([xmlContent], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${artist} - ${title} - Hot Cues.xml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Toggle play/pause functionality
function togglePlayPause() {
    if (isPlaying) {
        audioPlayer.pause();
        playPauseBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
        `;
    } else {
        audioPlayer.play();
        playPauseBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="6" y="4" width="4" height="16"></rect>
                <rect x="14" y="4" width="4" height="16"></rect>
            </svg>
        `;
    }
    isPlaying = !isPlaying;
}

// Initialize the player with new audio data
function initPlayer(audioData) {
    playerSection.style.display = 'block';
    document.getElementById('song-entry').style.display = 'block';
    document.getElementById('download-mp3-btn').parentElement.style.display = 'flex';

    initAudioContext();

    const blob = new Blob([audioData], { type: 'audio/mpeg' });
    const audioUrl = URL.createObjectURL(blob);
    audioPlayer.src = audioUrl;

    audioPlayer.addEventListener('loadedmetadata', () => {
        totalTimeDisplay.textContent = formatTime(audioPlayer.duration);
        fetch(audioUrl)
            .then(response => response.arrayBuffer())
            .then(buffer => audioContext.decodeAudioData(buffer))
            .then(decodedBuffer => {
                audioBuffer = decodedBuffer;
                waveformCanvas.width = waveformContainer.offsetWidth;
                waveformCanvas.height = waveformContainer.offsetHeight;
                drawWaveform(audioBuffer);
                bpmValue = parseInt(document.getElementById('r-bpm').textContent) || 0;
                drawBeatGrid(bpmValue, audioBuffer.duration);
            })
            .catch(error => console.error('Error loading audio data:', error));
    }, { once: true });

    // Prevent stacking of timeupdate listeners
    audioPlayer.removeEventListener('timeupdate', updatePlayhead);
    audioPlayer.addEventListener('timeupdate', updatePlayhead);

    // Handle MP3 download for this specific song
    downloadMp3Btn.addEventListener('click', () => {
        const a = document.createElement('a');
        a.href = audioUrl;
        a.download = `${document.getElementById('r-artist').textContent} - ${document.getElementById('r-title').textContent}.mp3`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    });
}

// Handle form submission for downloading a new song
document.getElementById('download-form').addEventListener('submit', function (ev) {
    ev.preventDefault();
    document.getElementById('loading-spinner').style.display = 'flex';
    document.getElementById('error-msg').style.display = 'none';
    document.getElementById('results').style.display = 'none';
    document.getElementById('player-section').style.display = 'none';
    document.getElementById('song-entry').style.display = 'none';

    // Reset UI elements from previous downloads
    if (downloadMp3Btn) downloadMp3Btn.parentElement.style.display = 'none';
    if (hotCuesList) hotCuesList.innerHTML = '';
    hotCues = [];
    document.getElementById('cover-preview').style.display = 'none';
    document.getElementById('cover-placeholder').style.display = 'flex';

    // Reset audio player state
    isPlaying = false;
    if (audioPlayer) {
        audioPlayer.pause();
        audioPlayer.currentTime = 0;
        playPauseBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
        `;
    }

    // Clear waveform, beat grid, and hot cues
    if (waveformCanvas) waveformCtx.clearRect(0, 0, waveformCanvas.width, waveformCanvas.height);
    if (beatGridContainer) beatGridContainer.innerHTML = '';
    if (hotCuesContainer) hotCuesContainer.innerHTML = '';

    const urlValue = document.querySelector('input[name="url"]').value;

    fetch('/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ url: urlValue })
    })
        .then(response => {
            if (!response.ok) {
                return response.json().then(data => { throw new Error(data.error || 'Unknown error'); });
            }
            const artist = response.headers.get('X-Artist') || 'Unknown';
            const title = response.headers.get('X-Title') || 'Unknown';
            const bpm = response.headers.get('X-Bpm') || '0';
            const key = response.headers.get('X-Key') || 'Unknown';

            // Load YouTube thumbnail as cover art
            const videoId = extractYouTubeId(urlValue);
            if (videoId) {
                const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/0.jpg`;
                const coverPreview = document.getElementById('cover-preview');
                coverPreview.src = thumbnailUrl;
                coverPreview.onload = () => {
                    coverPreview.style.display = 'block';
                    document.getElementById('cover-placeholder').style.display = 'none';
                };
            }

            return response.arrayBuffer().then(buffer => ({ buffer, artist, title, bpm, key }));
        })
        .then(({ buffer, artist, title, bpm, key }) => {
            document.getElementById('r-artist').textContent = artist;
            document.getElementById('r-title').textContent = title;
            document.getElementById('r-bpm').textContent = bpm;
            document.getElementById('r-key').textContent = key;
            document.getElementById('results').style.display = 'block';
            document.getElementById('player-section').style.display = 'block';
            document.getElementById('song-entry').style.display = 'block';
            document.getElementById('loading-spinner').style.display = 'none';

            initPlayer(buffer);
        })
        .catch(err => {
            document.getElementById('loading-spinner').style.display = 'none';
            document.getElementById('error-text').textContent = err.message;
            document.getElementById('error-msg').style.display = 'block';
        });
});

// Extract YouTube video ID from URL
function extractYouTubeId(url) {
    if (!url) return null;
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[7].length === 11) ? match[7] : null;
}

// Resize waveform and beat grid on window resize
window.addEventListener('resize', () => {
    if (audioBuffer) {
        waveformCanvas.width = waveformContainer.offsetWidth;
        waveformCanvas.height = waveformContainer.offsetHeight;
        drawWaveform(audioBuffer);
        drawBeatGrid(bpmValue, audioBuffer.duration);
        redrawHotCueMarkers();
    }
});