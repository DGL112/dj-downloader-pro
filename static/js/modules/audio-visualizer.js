/**
 * Audio Visualizer Module - Handles waveform and beat grid visualization
 */

/**
 * Initialize the audio visualizer
 * @param {Object} containers - Object containing DOM containers for visualization elements
 */
export function initVisualizer(containers) {
    const { waveformContainer, beatGridContainer, hotCuesContainer } = containers;
    
    // Create waveform canvas
    const waveformCanvas = document.createElement('canvas');
    waveformCanvas.id = 'waveform-canvas';
    if (waveformContainer) {
        waveformContainer.appendChild(waveformCanvas);
    }
    
    return {
        waveformCanvas,
        waveformCtx: waveformCanvas.getContext('2d')
    };
}

/**
 * Draw waveform from audio buffer
 * @param {AudioBuffer} buffer - Audio buffer to visualize
 * @param {Object} canvasContext - Canvas 2D context
 * @param {HTMLCanvasElement} canvas - Canvas element
 */
export function drawWaveform(buffer, canvasContext, canvas) {
    if (!canvasContext) return;
    
    const width = canvas.width;
    const height = canvas.height;
    const channelData = buffer.getChannelData(0);
    const step = Math.ceil(channelData.length / width);

    canvasContext.clearRect(0, 0, width, height);

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

        const gradient = canvasContext.createLinearGradient(0, y - height / 2 * amplitude, 0, y + height / 2 * amplitude);
        gradient.addColorStop(0, 'rgba(52, 152, 219, 0.8)');
        gradient.addColorStop(0.5, 'rgba(52, 152, 219, 0.5)');
        gradient.addColorStop(1, 'rgba(52, 152, 219, 0.8)');

        canvasContext.fillStyle = gradient;
        canvasContext.fillRect(i, y - height / 2 * amplitude, 1, height * amplitude);
    }
}

/**
 * Draw beat grid based on BPM
 * @param {number} bpm - Beats per minute
 * @param {number} duration - Track duration in seconds
 * @param {HTMLElement} container - Container for beat markers
 */
export function drawBeatGrid(bpm, duration, container) {
    if (!container || !bpm || bpm <= 0) return;
    
    container.innerHTML = '';

    const beatsPerSecond = bpm / 60;
    const totalBeats = Math.floor(beatsPerSecond * duration);

    for (let i = 0; i < totalBeats; i++) {
        const beatMarker = document.createElement('div');
        beatMarker.className = 'beat-marker';
        const beatTime = i / beatsPerSecond;
        const position = (beatTime / duration) * 100;
        beatMarker.style.left = `${position}%`;

        // Highlight every 4th beat (1st beat of each bar)
        if (i % 4 === 0) {
            beatMarker.style.backgroundColor = 'rgba(255, 255, 255, 0.4)';
            beatMarker.style.width = '2px';
        }

        container.appendChild(beatMarker);
    }
}

/**
 * Draw a hot cue marker
 * @param {Object} cue - Hot cue object
 * @param {number} duration - Track duration in seconds
 * @param {HTMLElement} container - Container for hot cue markers
 */
export function drawHotCueMarker(cue, duration, container) {
    if (!container) return;
    
    const position = (cue.time / duration) * 100;
    const marker = document.createElement('div');
    marker.className = 'hot-cue-marker';
    marker.setAttribute('data-cue', cue.name);
    marker.setAttribute('data-id', cue.id);
    marker.style.left = `${position}%`;
    container.appendChild(marker);
}

/**
 * Update playhead position
 * @param {number} currentTime - Current playback time
 * @param {number} duration - Total track duration
 * @param {HTMLElement} playhead - Playhead DOM element
 */
export function updatePlayhead(currentTime, duration, playhead) {
    if (!playhead || !duration) return;
    
    const position = (currentTime / duration) * 100;
    playhead.style.left = `${position}%`;
}
