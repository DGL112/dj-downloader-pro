/**
 * Audio Player Module - Handles audio playback and waveform visualization
 */

import { initVisualizer, drawWaveform, drawBeatGrid, drawHotCueMarker, updatePlayhead as updateVisualizerPlayhead } from './audio-visualizer.js';

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

// Visualizer objects
let visualizer;

/**
 * Initialize the audio player
 */
export function initAudioPlayer() {
    // Initialize AudioContext
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    // Initialize visualizer
    visualizer = initVisualizer({
        waveformContainer,
        beatGridContainer,
        hotCuesContainer
    });
    
    // Attach event listeners
    attachEventListeners();
    
    // Handle window resizing
    window.addEventListener('resize', handleResize);
}

/**
 * Attach event listeners to player controls
 */
function attachEventListeners() {
    if (playPauseBtn) {
        playPauseBtn.addEventListener('click', togglePlayPause);
    }
    
    if (addCueBtn) {
        addCueBtn.addEventListener('click', () => {
            createHotCue(audioPlayer.currentTime);
        });
    }
    
    if (exportCuesBtn) {
        exportCuesBtn.addEventListener('click', exportCuesToRekordbox);
    }
    
    if (waveformContainer) {
        waveformContainer.addEventListener('click', (e) => {
            if (!audioBuffer) return;
            const rect = waveformContainer.getBoundingClientRect();
            const clickPosition = (e.clientX - rect.left) / rect.width;
            const seekTime = clickPosition * audioBuffer.duration;
            audioPlayer.currentTime = seekTime;
            updatePlayhead();
        });
    }
    
    // Update playhead during playback
    audioPlayer.addEventListener('timeupdate', updatePlayhead);
}

/**
 * Load audio data into the player
 * @param {Blob} audioData - The audio data blob
 */
export function loadAudio(audioData) {
    const audioUrl = URL.createObjectURL(audioData);
    audioPlayer.src = audioUrl;
    
    audioPlayer.addEventListener('loadedmetadata', () => {
        if (totalTimeDisplay) {
            totalTimeDisplay.textContent = formatTime(audioPlayer.duration);
        }
        
        fetch(audioUrl)
            .then(response => response.arrayBuffer())
            .then(buffer => audioContext.decodeAudioData(buffer))
            .then(decodedBuffer => {
                audioBuffer = decodedBuffer;
                
                if (waveformContainer && visualizer) {
                    visualizer.waveformCanvas.width = waveformContainer.offsetWidth;
                    visualizer.waveformCanvas.height = waveformContainer.offsetHeight;
                    
                    // Draw waveform using the visualizer
                    drawWaveform(audioBuffer, visualizer.waveformCtx, visualizer.waveformCanvas);
                }
                
                bpmValue = parseInt(document.getElementById('song-bpm')?.textContent || '0');
                if (bpmValue && beatGridContainer) {
                    // Draw beat grid using the visualizer
                    drawBeatGrid(bpmValue, audioBuffer.duration, beatGridContainer);
                }
                
                // Setup download button
                setupDownloadButton(audioUrl);
            })
            .catch(error => console.error('Error loading audio data:', error));
    }, { once: true });
    
    // Reset playback state
    isPlaying = false;
    
    // Clear hot cues array
    hotCues = [];
    
    // Clear visual hot cue markers
    if (hotCuesContainer) {
        hotCuesContainer.innerHTML = '';
    }
    
    // Clear hot cues list
    if (hotCuesList) {
        hotCuesList.innerHTML = '';
    }
    
    updatePlayPauseButton();
}

/**
 * Setup the download button for the audio
 * @param {string} audioUrl - URL to the audio file
 */
function setupDownloadButton(audioUrl) {
    const downloadBtn = document.getElementById('download-mp3-btn');
    if (!downloadBtn) return;
    
    // Remove existing listener to prevent memory leaks
    const newBtn = downloadBtn.cloneNode(true);
    if (downloadBtn.parentNode) {
        downloadBtn.parentNode.replaceChild(newBtn, downloadBtn);
    }
    
    // Add fresh event listener
    newBtn.addEventListener('click', () => {
        const artist = document.getElementById('song-artist')?.textContent || 'Unknown';
        const title = document.getElementById('song-title')?.textContent || 'Unknown';
        
        const a = document.createElement('a');
        a.href = audioUrl;
        a.download = `${artist} - ${title}.mp3`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    });
}

/**
 * Toggle play/pause state
 */
function togglePlayPause() {
    if (!audioBuffer) return;
    
    if (isPlaying) {
        audioPlayer.pause();
    } else {
        audioPlayer.play();
    }
    
    isPlaying = !isPlaying;
    updatePlayPauseButton();
}

/**
 * Update the play/pause button state
 */
function updatePlayPauseButton() {
    if (!playPauseBtn) return;
    
    if (isPlaying) {
        playPauseBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="6" y="4" width="4" height="16"></rect>
                <rect x="14" y="4" width="4" height="16"></rect>
            </svg>
        `;
    } else {
        playPauseBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
        `;
    }
}

/**
 * Update the playhead position
 */
function updatePlayhead() {
    if (!audioBuffer || !playhead || !currentTimeDisplay) return;
    
    const currentTime = audioPlayer.currentTime;
    
    // Update playhead using visualizer
    updateVisualizerPlayhead(currentTime, audioBuffer.duration, playhead);
    
    // Update time display
    currentTimeDisplay.textContent = formatTime(currentTime);
}

/**
 * Create a hot cue
 * @param {number} time - Time position in seconds
 * @param {string} name - Name of the cue point
 * @returns {Object} The created cue point
 */
function createHotCue(time, name) {
    const cueId = Date.now();
    const cue = { id: cueId, time, name: name || `Cue ${hotCues.length + 1}` };
    hotCues.push(cue);
    
    // Draw using visualizer
    if (audioBuffer) {
        drawHotCueMarker(cue, audioBuffer.duration, hotCuesContainer);
    }
    
    updateHotCuesList();
    return cue;
}

/**
 * Redraw all hot cue markers
 */
function redrawHotCueMarkers() {
    if (!hotCuesContainer || !audioBuffer) return;
    
    hotCuesContainer.innerHTML = '';
    hotCues.forEach(cue => {
        drawHotCueMarker(cue, audioBuffer.duration, hotCuesContainer);
    });
}

/**
 * Update the hot cues list in the UI
 */
function updateHotCuesList() {
    if (!hotCuesList) return;
    
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

/**
 * Jump to a specific cue point
 * @param {string} cueId - The ID of the cue point
 */
function jumpToCue(cueId) {
    const cue = hotCues.find(c => c.id === cueId);
    if (cue) {
        audioPlayer.currentTime = cue.time;
        updatePlayhead();
    }
}

/**
 * Delete a cue point
 * @param {string} cueId - The ID of the cue point to delete
 */
function deleteCue(cueId) {
    hotCues = hotCues.filter(cue => cue.id !== cueId);
    updateHotCuesList();
    redrawHotCueMarkers();
}

/**
 * Export hot cues to Rekordbox XML format
 */
function exportCuesToRekordbox() {
    if (hotCues.length === 0) {
        alert('No hot cues to export!');
        return;
    }
    
    const artist = document.getElementById('song-artist')?.textContent || 'Unknown';
    const title = document.getElementById('song-title')?.textContent || 'Unknown';
    const key = document.getElementById('song-key')?.textContent || 'Unknown';
    const bpm = document.getElementById('song-bpm')?.textContent || '0';
    
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

/**
 * Handle window resize event
 */
function handleResize() {
    if (!audioBuffer || !waveformContainer || !visualizer) return;
    
    visualizer.waveformCanvas.width = waveformContainer.offsetWidth;
    visualizer.waveformCanvas.height = waveformContainer.offsetHeight;
    
    drawWaveform(audioBuffer, visualizer.waveformCtx, visualizer.waveformCanvas);
    drawBeatGrid(bpmValue, audioBuffer.duration, beatGridContainer);
    redrawHotCueMarkers();
}

/**
 * Format time in MM:SS
 * @param {number} seconds - Time in seconds
 * @returns {string} Formatted time string
 */
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
}
