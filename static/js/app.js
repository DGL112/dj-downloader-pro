/**
 * DJ Downloader Pro - Main Application
 */

// Track download events to prevent duplicates
let lastDownloadEvent = 0;
const DOWNLOAD_EVENT_COOLDOWN = 5000; // 5 seconds cooldown

// Global flags to prevent duplicate notifications
window.DJ_DOWNLOADER = window.DJ_DOWNLOADER || {};
window.DJ_DOWNLOADER.notificationLocks = {
    downloadSuccess: false
};

// Intercept all download-related events
document.addEventListener('click', function(event) {
    // Check if this is a download button or similar element
    if (event.target.matches('.download-btn, [data-action="download"], button[type="submit"]')) {
        const now = Date.now();
        
        // Prevent multiple rapid download clicks
        if (now - lastDownloadEvent < DOWNLOAD_EVENT_COOLDOWN) {
            console.log('Preventing duplicate download event');
            event.preventDefault();
            event.stopPropagation();
            return false;
        }
        
        // Record this download event
        lastDownloadEvent = now;
    }
}, true); // Use capture phase to intercept early

// Import modules
import { initAudioPlayer, loadAudio } from './modules/audio-player.js';
import { initUI, showLoading, hideLoading, showError, updateDownloadProgress, updateTrackInfo, showSongEntry } from './modules/ui-controller.js';
import { loadUserPreferences } from './modules/preferences.js';
import { initNotifications, notify } from './modules/notifications.js';

// Main initialization when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize UI components
    initUI();
    
    // Initialize audio player
    initAudioPlayer();
    
    // Initialize notifications system
    initNotifications();
    
    // Load user preferences (volume, waveform visibility, etc.)
    loadUserPreferences();
    
    // Set up form submission handler
    setupFormHandler();

    // Clear any existing notification locks on page load
    window.DJ_DOWNLOADER.notificationLocks = {
        downloadSuccess: false
    };
});

// Setup the download form handler
function setupFormHandler() {
    const downloadForm = document.getElementById('download-form');
    if (!downloadForm) return;
    
    downloadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Hide previous results and errors
        document.getElementById('results').style.display = 'none';
        document.getElementById('error-msg').style.display = 'none';
        document.getElementById('song-entry').style.display = 'none';
        
        // Show loading spinner
        showLoading();
        
        const urlInput = document.querySelector('input[name="url"]');
        const url = urlInput.value.trim();
        
        if (!url) {
            hideLoading();
            showError('Please enter a YouTube URL');
            return;
        }
        
        try {
            // Ensure these notifications work regardless of locks
            window.DJ_DOWNLOADER.notificationLocks = {
                downloadSuccess: false // Reset any locks when starting a new download
            };
            
            // Show an info notification - don't use the lock system for info messages
            notify.info('Starting download and analysis process...', { forceShow: true });
            
            // Start the download process
            const taskId = await startDownload(url);
            
            // Poll for status until complete
            await pollDownloadStatus(taskId);
            
        } catch (error) {
            hideLoading();
            showError(error.message || 'An error occurred during the download process.');
            console.error('Download error:', error);
            notify.error('Download failed: ' + (error.message || 'Unknown error'));
        }
    });
}

// Start the download process
async function startDownload(url) {
    const formData = new FormData();
    formData.append('url', url);
    
    const response = await fetch('/api/download', {
        method: 'POST',
        body: formData
    });
    
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start download');
    }
    
    const data = await response.json();
    return data.task_id;
}

// Poll for download status
async function pollDownloadStatus(taskId) {
    let completed = false;
    let attempts = 0;
    const maxAttempts = 300; // 5 minutes (1s intervals)
    
    // Status flags to track progress phases
    let downloadingNotified = false;
    let analyzingNotified = false;
    
    while (!completed && attempts < maxAttempts) {
        attempts++;
        
        try {
            const response = await fetch(`/api/status/${taskId}`);
            
            if (!response.ok) {
                throw new Error('Failed to check download status');
            }
            
            const status = await response.json();
            
            // Update progress bar
            updateDownloadProgress(status.progress, status.message);
            
            // Show phase-specific notifications
            if (status.status === 'downloading' && !downloadingNotified) {
                notify.info('Downloading audio from YouTube...');
                downloadingNotified = true;
            } else if (status.status === 'analyzing' && !analyzingNotified) {
                notify.info('Analyzing audio for BPM and key...');
                analyzingNotified = true;
            }
            
            // If we have track info, update the UI
            if (status.artist && status.title) {
                updateTrackInfo({
                    artist: status.artist,
                    title: status.title,
                    bpm: status.bpm || '0',
                    key: status.key || 'Unknown'
                });
            }
            
            // Check if complete or error
            if (status.status === 'completed') {
                completed = true;
                await downloadComplete(taskId);
                break;
            } else if (status.status === 'error') {
                throw new Error(status.message);
            }
            
            // Wait before polling again
            await new Promise(resolve => setTimeout(resolve, 1000));
            
        } catch (error) {
            hideLoading();
            showError(error.message || 'Failed to check download status');
            return;
        }
    }
    
    if (!completed) {
        hideLoading();
        showError('Download timed out. Please try again later.');
        notify.error('Download timed out. Please try again later.');
    }
}

// Handle download completion
async function downloadComplete(taskId) {
    try {
        // Fetch the actual audio data
        const response = await fetch(`/api/download/${taskId}`);
        
        if (!response.ok) {
            throw new Error('Failed to download the audio file');
        }
        
        // Get metadata from headers
        const artist = response.headers.get('X-Artist') || 'Unknown Artist';
        const title = response.headers.get('X-Title') || 'Unknown Title';
        const bpm = response.headers.get('X-Bpm') || '0';
        const key = response.headers.get('X-Key') || 'Unknown';
        const hasCover = response.headers.get('X-Has-Cover') === 'true';
        
        // Get a blob of the audio data
        const audioBlob = await response.blob();
        
        // Extract YouTube ID for thumbnail (if available)
        const url = document.querySelector('input[name="url"]').value.trim();
        const videoId = extractYouTubeId(url);
        
        // Update UI with the track info
        const trackInfo = {
            artist,
            title,
            bpm,
            key,
            videoId,
            hasCover
        };
        
        // Hide loading and show the song entry
        hideLoading();
        showSongEntry(trackInfo);
        
        // Show success notification - only if not shown recently
        if (!window.DJ_DOWNLOADER.notificationLocks.downloadSuccess) {
            // Set the lock to prevent duplicates
            window.DJ_DOWNLOADER.notificationLocks.downloadSuccess = true;
            
            // Log that we're showing the notification
            console.log(`Showing download success notification for ${artist} - ${title}`);
            
            // Changed from "successfully downloaded" to "successfully analyzed"
            notify.success(`Track "${artist} - ${title}" successfully analyzed`, {
                duration: 8000
            });
            
            // Clear the lock after a delay
            setTimeout(() => {
                window.DJ_DOWNLOADER.notificationLocks.downloadSuccess = false;
                console.log('Download notification lock cleared');
            }, 30000); // 30 seconds lock
        } else {
            console.log('Suppressing duplicate download notification - lock is active');
        }
        
        // Initialize audio player with the downloaded audio
        loadAudio(audioBlob);
        
    } catch (error) {
        hideLoading();
        showError(error.message || 'Error downloading the audio file');
        notify.error('Error downloading the audio file');
    }
}

// Extract YouTube video ID from URL
function extractYouTubeId(url) {
    if (!url) return null;
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[7].length === 11) ? match[7] : null;
}