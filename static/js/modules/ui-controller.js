/**
 * UI Controller Module - Handles UI updates and interactions
 */

import { saveUserPreference, loadUserPreference } from './preferences.js';

// Flag to track waveform expansion state
let isWaveformExpanded = false;

/**
 * Initialize UI elements and event listeners
 */
export function initUI() {
    // Set up volume controls
    setupVolumeControls();
    
    // Set up toggle waveform button
    setupToggleWaveform();
    
    // Load the waveform expanded state from preferences
    isWaveformExpanded = loadUserPreference('waveformExpanded', false);
    updateWaveformVisibility();
    
    // Add progress bar to loading spinner
    setupProgressBar();
    
    // Set up notifications
    setupNotifications();
}

/**
 * Set up the progress bar for downloads
 */
function setupProgressBar() {
    const loadingSpinner = document.getElementById('loading-spinner');
    if (!loadingSpinner) return;
    
    // Add progress bar elements if they don't exist
    if (!document.getElementById('progress-container')) {
        const progressContainer = document.createElement('div');
        progressContainer.id = 'progress-container';
        progressContainer.className = 'progress-container';
        
        const progressBar = document.createElement('div');
        progressBar.id = 'progress-bar';
        progressBar.className = 'progress-bar';
        
        const progressLabel = document.createElement('div');
        progressLabel.id = 'progress-label';
        progressLabel.className = 'progress-label';
        progressLabel.textContent = 'Starting download...';
        
        progressContainer.appendChild(progressBar);
        progressContainer.appendChild(progressLabel);
        loadingSpinner.appendChild(progressContainer);
    }
}

/**
 * Set up volume controls
 */
function setupVolumeControls() {
    const audioPlayer = document.getElementById('audio-player');
    const volumeSlider = document.getElementById('volume-slider');
    const volumePercentage = document.getElementById('volume-percentage');
    const muteBtn = document.getElementById('mute-btn');
    
    if (!audioPlayer || !volumeSlider || !volumePercentage || !muteBtn) return;
    
    // Load saved volume settings
    const savedVolume = loadUserPreference('volume', 80);
    const savedMuted = loadUserPreference('muted', false);
    
    // Apply saved settings
    volumeSlider.value = savedVolume;
    audioPlayer.volume = savedVolume / 100;
    volumePercentage.textContent = `${savedVolume}%`;
    
    if (savedMuted) {
        audioPlayer.volume = 0;
        updateMuteButtonIcon(true);
    } else {
        updateMuteButtonIcon(false);
    }
    
    // Volume slider change event
    volumeSlider.addEventListener('input', () => {
        const value = volumeSlider.value;
        
        if (value > 0 && loadUserPreference('muted', false)) {
            // Unmute when volume is adjusted
            saveUserPreference('muted', false);
            updateMuteButtonIcon(false);
        }
        
        audioPlayer.volume = value / 100;
        volumePercentage.textContent = `${value}%`;
        saveUserPreference('volume', value);
    });
    
    // Mute button click event
    muteBtn.addEventListener('click', () => {
        const currentlyMuted = loadUserPreference('muted', false);
        const newMuteState = !currentlyMuted;
        
        saveUserPreference('muted', newMuteState);
        
        if (newMuteState) {
            audioPlayer.volume = 0;
        } else {
            audioPlayer.volume = volumeSlider.value / 100;
        }
        
        updateMuteButtonIcon(newMuteState);
    });
}

/**
 * Update the mute button icon based on mute state
 * @param {boolean} isMuted - Whether audio is muted
 */
function updateMuteButtonIcon(isMuted) {
    const muteBtn = document.getElementById('mute-btn');
    if (!muteBtn) return;
    
    if (isMuted) {
        muteBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                <line x1="23" y1="9" x2="17" y2="15"></line>
                <line x1="17" y1="9" x2="23" y2="15"></line>
            </svg>
        `;
    } else {
        muteBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                <path d="M19 12l2-2"></path>
                <path d="M15 12l2-2"></path>
                <path d="M19 16l2-2"></path>
                <path d="M15 16l2-2"></path>
            </svg>
        `;
    }
}

/**
 * Set up toggle waveform button
 */
function setupToggleWaveform() {
    const toggleBtn = document.getElementById('toggle-waveform-btn');
    if (!toggleBtn) return;
    
    toggleBtn.addEventListener('click', () => {
        isWaveformExpanded = !isWaveformExpanded;
        saveUserPreference('waveformExpanded', isWaveformExpanded);
        updateWaveformVisibility();
    });
}

/**
 * Update waveform visibility based on expanded state
 */
function updateWaveformVisibility() {
    const playerSectionWrapper = document.getElementById('player-section-wrapper');
    const toggleBtn = document.getElementById('toggle-waveform-btn');
    const songEntry = document.getElementById('song-entry');
    
    if (!toggleBtn) return;
    
    if (isWaveformExpanded) {
        if (playerSectionWrapper) playerSectionWrapper.style.display = 'block';
        toggleBtn.classList.add('expanded');
        toggleBtn.querySelector('.toggle-text').textContent = 'Hide Waveform';
        if (songEntry) songEntry.classList.remove('waveform-hidden');
    } else {
        if (playerSectionWrapper) playerSectionWrapper.style.display = 'none';
        toggleBtn.classList.remove('expanded');
        toggleBtn.querySelector('.toggle-text').textContent = 'Show Waveform';
        if (songEntry) songEntry.classList.add('waveform-hidden');
    }
    
    // Trigger a resize event to redraw waveform if it's now visible
    if (isWaveformExpanded) {
        setTimeout(() => {
            window.dispatchEvent(new Event('resize'));
        }, 100);
    }
}

/**
 * Set up notifications system
 */
function setupNotifications() {
    // Create notification container if it doesn't exist
    if (!document.getElementById('notification-container')) {
        const container = document.createElement('div');
        container.id = 'notification-container';
        document.body.appendChild(container);
    }
}

/**
 * Show a notification
 * @param {string} message - Notification message
 * @param {string} type - Type of notification (success, error, info)
 * @param {number} duration - Duration in ms to show notification
 */
export function showNotification(message, type = 'info', duration = 5000) {
    const container = document.getElementById('notification-container');
    if (!container) return;
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    // Set icon based on type
    let icon = '';
    if (type === 'success') {
        icon = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2ecc71" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>';
    } else if (type === 'error') {
        icon = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e74c3c" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>';
    } else {
        icon = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3498db" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';
    }
    
    notification.innerHTML = `
        <div class="notification-icon">${icon}</div>
        <div class="notification-text">${message}</div>
        <button class="notification-close">&times;</button>
    `;
    
    // Add to container
    container.appendChild(notification);
    
    // Show notification after a small delay
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Add close button functionality
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    });
    
    // Auto-remove after duration
    if (duration > 0) {
        setTimeout(() => {
            if (notification.parentNode) {
                notification.classList.remove('show');
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 300);
            }
        }, duration);
    }
}

/**
 * Show loading spinner with progress bar
 */
export function showLoading() {
    const loadingSpinner = document.getElementById('loading-spinner');
    if (loadingSpinner) loadingSpinner.style.display = 'flex';
    
    // Reset progress bar
    updateDownloadProgress(0, 'Starting download...');
}

/**
 * Hide loading spinner
 */
export function hideLoading() {
    const loadingSpinner = document.getElementById('loading-spinner');
    if (loadingSpinner) loadingSpinner.style.display = 'none';
}

/**
 * Show error message
 * @param {string} message - Error message to display
 */
export function showError(message) {
    const errorMsg = document.getElementById('error-msg');
    const errorText = document.getElementById('error-text');
    
    if (errorMsg && errorText) {
        errorText.textContent = message;
        errorMsg.style.display = 'block';
    }
}

/**
 * Update download progress and message
 * @param {number} progress - Progress percentage (0-100)
 * @param {string} message - Progress message to display
 */
export function updateDownloadProgress(progress, message) {
    const progressBar = document.getElementById('progress-bar');
    const progressLabel = document.getElementById('progress-label');
    
    if (progressBar) {
        progressBar.style.width = `${progress}%`;
    }
    
    if (progressLabel) {
        progressLabel.textContent = message;
    }
}

/**
 * Update track info in both results and song entry
 * @param {Object} trackInfo - Track information object
 */
export function updateTrackInfo(trackInfo) {
    // Update main results area
    updateElement('r-artist', trackInfo.artist);
    updateElement('r-title', trackInfo.title);
    updateElement('r-bpm', trackInfo.bpm);
    updateElement('r-key', trackInfo.key);
    
    // Also update song entry details
    updateElement('song-artist', trackInfo.artist);
    updateElement('song-title', trackInfo.title);
    updateElement('song-bpm', trackInfo.bpm);
    updateElement('song-key', trackInfo.key);
    
    // Update album art if video ID is available
    if (trackInfo.videoId) {
        const thumbnailUrl = `https://img.youtube.com/vi/${trackInfo.videoId}/0.jpg`;
        updateAlbumArt('cover-preview', 'cover-placeholder', thumbnailUrl);
        updateAlbumArt('song-cover-preview', 'song-cover-placeholder', thumbnailUrl);
    }
}

/**
 * Show song entry with track info
 * @param {Object} trackInfo - Track information object
 */
export function showSongEntry(trackInfo) {
    // Update track info first
    updateTrackInfo(trackInfo);
    
    // Show the song entry container
    const songEntry = document.getElementById('song-entry');
    if (songEntry) songEntry.style.display = 'block';
    
    // Update waveform visibility based on user preference
    updateWaveformVisibility();
    
    // Show the download button
    const downloadBtn = document.getElementById('download-mp3-btn');
    if (downloadBtn && downloadBtn.parentElement) {
        downloadBtn.parentElement.style.display = 'flex';
    }
    
    // Show notification
    showNotification(`Track ${trackInfo.artist} - ${trackInfo.title} successfully downloaded`, 'success');
}

/**
 * Helper function to update element content
 * @param {string} id - Element ID
 * @param {string} value - New content value
 */
function updateElement(id, value) {
    const element = document.getElementById(id);
    if (element && value) element.textContent = value;
}

/**
 * Helper function to update album art
 * @param {string} imgId - Image element ID
 * @param {string} placeholderId - Placeholder element ID
 * @param {string} url - Image URL
 */
function updateAlbumArt(imgId, placeholderId, url) {
    const img = document.getElementById(imgId);
    const placeholder = document.getElementById(placeholderId);
    
    if (img && placeholder && url) {
        img.src = url;
        img.onload = () => {
            img.style.display = 'block';
            placeholder.style.display = 'none';
        };
    }
}