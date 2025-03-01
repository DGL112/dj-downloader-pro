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

    // Add event listener for the Auto Cues button
    if (document.getElementById('auto-cue-btn')) {
        document.getElementById('auto-cue-btn').addEventListener('click', () => {
            // Show a simple genre selector
            const genre = prompt('Select genre (dnb, house, techno, hiphop, or leave blank for auto-detection):', 'auto');
            autoSetHotCues({
                genre: genre || 'auto',
                clearExisting: confirm('Clear existing cue points?')
            });
        });
    }
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

/**
 * Automatically set hot cues based on musical phrases and genre detection
 * @param {Object} config - Configuration options
 * @param {string} config.genre - Genre hint ('dnb', 'house', etc.) or 'auto' for detection
 * @param {number} config.phraseLength - Number of bars per phrase (default: 16 for most genres)
 * @param {boolean} config.clearExisting - Whether to clear existing hot cues (default: true)
 * @param {boolean} config.includePreTransitionCues - Add cues before drops (default: true)
 * @returns {Array} - Array of created cue IDs
 */
export function autoSetHotCues(config = {}) {
    if (!audioBuffer) {
        console.error("No audio loaded. Cannot set auto cues.");
        return [];
    }
    
    // Default configuration
    const defaultConfig = {
        genre: 'auto',
        phraseLength: 16,
        clearExisting: true,
        includePreTransitionCues: true,
        maxCues: 8  // Maximum number of hot cues to create
    };
    
    const options = { ...defaultConfig, ...config };
    
    // Clear existing cues if requested
    if (options.clearExisting) {
        hotCues = [];
        if (hotCuesContainer) {
            hotCuesContainer.innerHTML = '';
        }
        if (hotCuesList) {
            hotCuesList.innerHTML = '';
        }
    }
    
    // Get BPM from UI or use a sensible default
    const bpm = parseInt(document.getElementById('song-bpm')?.textContent || '0') || 128;
    
    // Detect genre if set to auto
    let genre = options.genre;
    if (genre === 'auto') {
        // Simple genre detection based on BPM
        if (bpm >= 165 && bpm <= 180) {
            genre = 'dnb';
        } else if (bpm >= 120 && bpm <= 130) {
            genre = 'house';
        } else if (bpm >= 138 && bpm <= 155) {
            genre = 'techno';
        } else if (bpm >= 85 && bpm <= 115) {
            genre = 'hiphop';
        } else {
            genre = 'other';
        }
    }
    
    // Duration in seconds
    const duration = audioBuffer.duration;
    
    // Calculate beats and bars
    const beatsPerSecond = bpm / 60;
    const secondsPerBeat = 60 / bpm;
    const beatsPerBar = 4; // Standard 4/4 time signature
    const secondsPerBar = beatsPerBar * secondsPerBeat;
    const secondsPerPhrase = options.phraseLength * secondsPerBar;
    
    // Calculate total number of phrases in the track
    const totalPhrases = Math.floor(duration / secondsPerPhrase);
    
    // Audio analysis for detecting drops and transitions
    const dropPositions = detectDrops(audioBuffer, bpm, genre);
    
    // Store created cue IDs
    const createdCueIds = [];
    
    // Set cues at the beginning of each phrase (up to a reasonable limit)
    const maxRegularPhrases = 4; // Limit regular phrase cues to avoid cluttering
    for (let i = 0; i < Math.min(totalPhrases, maxRegularPhrases); i++) {
        const cueTime = i * secondsPerPhrase;
        if (cueTime < duration) {
            const cue = createHotCue(cueTime, `Phrase ${i+1}`);
            createdCueIds.push(cue.id);
        }
    }
    
    // For DnB tracks, set additional cues at drops and before them
    if (genre === 'dnb') {
        dropPositions.forEach((dropTime, index) => {
            // Cue at the drop
            if (dropTime < duration) {
                const cue = createHotCue(dropTime, `Drop ${index+1}`);
                createdCueIds.push(cue.id);
                
                // If requested, add cues before the drop (typically 32 bars or 2 phrases before)
                if (options.includePreTransitionCues) {
                    const preDropTime = Math.max(0, dropTime - (2 * secondsPerPhrase));
                    const cue = createHotCue(preDropTime, `Pre-Drop ${index+1}`);
                    createdCueIds.push(cue.id);
                }
            }
        });
    }
    
    // Ensure we haven't created too many cues
    if (hotCues.length > options.maxCues) {
        // Remove excess cues, keeping the most important ones
        const excessCues = hotCues.length - options.maxCues;
        // Find the least important cues (based on position or name)
        const cuesToRemove = hotCues
            .filter(cue => cue.name.startsWith('Phrase'))
            .slice(0, excessCues);
            
        // Remove the excess cues
        cuesToRemove.forEach(cue => {
            deleteCue(cue.id);
        });
    }
    
    // Update the UI
    updateHotCuesList();
    
    return createdCueIds;
}

/**
 * Detect drops in the audio by analyzing amplitude changes
 * 
 * @param {AudioBuffer} buffer - The audio buffer to analyze
 * @param {number} bpm - Beats per minute
 * @param {string} genre - Music genre
 * @returns {Array} - Array of drop positions in seconds
 */
function detectDrops(buffer, bpm, genre) {
    // Get audio data from the first channel
    const audioData = buffer.getChannelData(0);
    const sampleRate = buffer.sampleRate;
    
    // Calculate basic audio parameters
    const secondsPerBeat = 60 / bpm;
    const samplesPerBeat = secondsPerBeat * sampleRate;
    
    // For DnB, a typical drop occurs around 16, 32, or 64 bars from the start
    const dropPositions = [];
    
    if (genre === 'dnb') {
        // Function to calculate average energy in a window
        const getAverageEnergy = (startSample, windowSize) => {
            let sum = 0;
            const end = Math.min(startSample + windowSize, audioData.length);
            for (let i = startSample; i < end; i++) {
                sum += Math.abs(audioData[i]);
            }
            return sum / windowSize;
        };
        
        // Typical bar positions where drops might occur in DnB
        const potentialDropBars = [16, 32, 48, 64, 96, 128];
        const beatsPerBar = 4;
        
        // Window size for energy calculation (2 beats)
        const windowSize = samplesPerBeat * 2;
        
        potentialDropBars.forEach(barPosition => {
            // Convert bar position to sample index
            const beatPosition = barPosition * beatsPerBar;
            const samplePosition = Math.floor(beatPosition * samplesPerBeat);
            
            if (samplePosition >= audioData.length) return;
            
            // Get energy before and after the potential drop
            const energyBefore = getAverageEnergy(samplePosition - windowSize, windowSize);
            const energyAfter = getAverageEnergy(samplePosition, windowSize);
            
            // If energy increases significantly, it's likely a drop
            const energyRatio = energyAfter / energyBefore;
            if (energyRatio > 1.5) {
                // Convert sample position back to seconds
                const dropTimeSeconds = samplePosition / sampleRate;
                dropPositions.push(dropTimeSeconds);
            }
        });
        
        // If no drops detected with the energy method, use heuristics
        if (dropPositions.length === 0) {
            // For DnB, first drop often happens around 32-64 bars in
            const firstDropBar = 32;
            const firstDropTime = firstDropBar * beatsPerBar * secondsPerBeat;
            
            // Second drop often 32-64 bars after the first
            const secondDropBar = firstDropBar + 64;
            const secondDropTime = secondDropBar * beatsPerBar * secondsPerBeat;
            
            // Only add drops that are within the track duration
            if (firstDropTime < buffer.duration) {
                dropPositions.push(firstDropTime);
            }
            
            if (secondDropTime < buffer.duration) {
                dropPositions.push(secondDropTime);
            }
        }
    }
    
    return dropPositions;
}
