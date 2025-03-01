/**
 * Preferences Module - Handles storing and retrieving user preferences
 */

// Storage prefix to avoid collisions
const STORAGE_PREFIX = 'djDownloader_';

/**
 * Save a user preference to localStorage
 * @param {string} key - Preference key
 * @param {*} value - Preference value (will be JSON stringified)
 */
export function saveUserPreference(key, value) {
    try {
        const storageKey = `${STORAGE_PREFIX}${key}`;
        localStorage.setItem(storageKey, JSON.stringify(value));
    } catch (error) {
        console.error(`Error saving preference '${key}':`, error);
    }
}

/**
 * Load a user preference from localStorage
 * @param {string} key - Preference key
 * @param {*} defaultValue - Default value if preference not found
 * @returns {*} The stored value or default value
 */
export function loadUserPreference(key, defaultValue) {
    try {
        const storageKey = `${STORAGE_PREFIX}${key}`;
        const storedValue = localStorage.getItem(storageKey);
        
        if (storedValue === null) {
            return defaultValue;
        }
        
        return JSON.parse(storedValue);
    } catch (error) {
        console.error(`Error loading preference '${key}':`, error);
        return defaultValue;
    }
}

/**
 * Clear all stored preferences
 */
export function clearAllPreferences() {
    try {
        const keysToRemove = [];
        
        // Find all keys with our prefix
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith(STORAGE_PREFIX)) {
                keysToRemove.push(key);
            }
        }
        
        // Remove all found keys
        keysToRemove.forEach(key => localStorage.removeItem(key));
        
    } catch (error) {
        console.error('Error clearing preferences:', error);
    }
}

/**
 * Load all user preferences that affect the audio player
 */
export function loadUserPreferences() {
    // Volume settings
    const volume = loadUserPreference('volume', 80);
    const muted = loadUserPreference('muted', false);
    
    const audioPlayer = document.getElementById('audio-player');
    if (audioPlayer) {
        audioPlayer.volume = muted ? 0 : volume / 100;
    }
    
    // Waveform visibility
    const waveformExpanded = loadUserPreference('waveformExpanded', false);
    
    // This will be handled by the UI controller
}
