/**
 * Notifications Module - Handles UI notifications and alerts
 */

// Default notification settings
const DEFAULT_SETTINGS = {
    duration: 5000,  // 5 seconds
    position: 'bottom-right',
    closeButton: true,
    animationDuration: 300  // ms
};

// Notification types and their icons
const NOTIFICATION_TYPES = {
    success: {
        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2ecc71" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>',
        bgColor: 'rgba(46, 204, 113, 0.2)',
        borderColor: '#2ecc71'
    },
    error: {
        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e74c3c" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>',
        bgColor: 'rgba(231, 76, 60, 0.2)',
        borderColor: '#e74c3c'
    },
    info: {
        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3498db" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>',
        bgColor: 'rgba(52, 152, 219, 0.2)',
        borderColor: '#3498db'
    },
    warning: {
        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f39c12" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>',
        bgColor: 'rgba(243, 156, 18, 0.2)',
        borderColor: '#f39c12'
    }
};

// Active notifications tracker
let activeNotifications = [];

// Track recent messages to prevent duplicates
let recentMessages = {};
const DEDUPLICATION_WINDOW = 10000; // Increased to 10 seconds
const DOWNLOAD_SUCCESS_PATTERN = /track .* successfully (downloaded|analyzed)/i;

// Add a flag to track notifications in process
let notificationInProgress = false;

/**
 * Initialize the notification system
 */
export function initNotifications() {
    // Create container if it doesn't exist
    if (!document.getElementById('notification-container')) {
        const container = document.createElement('div');
        container.id = 'notification-container';
        document.body.appendChild(container);
        
        // Add basic styles if not already defined in CSS
        addBasicStyles();
    }
}

/**
 * Show a notification
 * @param {string} message - Notification message
 * @param {string} type - Type of notification (success, error, warning, info)
 * @param {Object} options - Additional options
 */
export function showNotification(message, type = 'info', options = {}) {
    // Define variables at the top level of the function for proper scope
    const now = Date.now();
    let messageKey = null;
    let shouldDedup = true;
    
    // If forceShow is true, bypass all deduplication
    if (options.forceShow) {
        console.log('Forcing notification display:', message);
        shouldDedup = false;
    } else {
        // Special case for download success messages - most aggressive filtering
        if (type === 'success' && /track .* successfully (downloaded|analyzed)/i.test(message)) {
            // Check global lock first
            if (window.DJ_DOWNLOADER && window.DJ_DOWNLOADER.notificationLocks && 
                window.DJ_DOWNLOADER.notificationLocks.downloadSuccess) {
                console.log('BLOCKED: Download notification suppressed by global lock:', message);
                return null;
            }
            
            // Even without the lock, enforce a longer deduplication window for these
            messageKey = 'download-success'; // Use a generic key for all download success messages
            
            // Use a longer window (30 seconds) for download messages
            if (recentMessages[messageKey] && (now - recentMessages[messageKey] < 30000)) {
                console.log('BLOCKED: Download success notification duplicated within 30 seconds');
                return null;
            }
            
            console.log('Showing download success notification:', message);
        } else {
            // Regular deduplication for other messages
            const normalizedMessage = message.trim().toLowerCase();
            const isDownloadSuccess = DOWNLOAD_SUCCESS_PATTERN.test(normalizedMessage);
            
            messageKey = isDownloadSuccess 
                ? `download-success-${extractTrackName(normalizedMessage)}`
                : `${normalizedMessage}-${type}`;
            
            if (recentMessages[messageKey] && (now - recentMessages[messageKey] < DEDUPLICATION_WINDOW)) {
                console.log('Preventing duplicate notification:', message);
                console.log('Time since last similar notification:', now - recentMessages[messageKey], 'ms');
                console.log('Using key:', messageKey);
                return null;
            }
        }
        
        // Check if any notification is currently being processed
        if (notificationInProgress && !options.forceShow) {
            console.log('Another notification is already in progress, delaying:', message);
            // Wait a bit and try again
            setTimeout(() => showNotification(message, type, options), 200);
            return null;
        }
    }
    
    // Flag that we're processing a notification
    notificationInProgress = true;
    
    // Record this message as recently shown, but only if we have a key
    if (messageKey && shouldDedup) {
        recentMessages[messageKey] = now;
    }
    
    // Clean up old records (more than 10 seconds old)
    Object.keys(recentMessages).forEach(key => {
        if (now - recentMessages[key] > 10000) {
            delete recentMessages[key];
        }
    });
    
    try {
        // Ensure the notification container exists
        initNotifications();
        
        const container = document.getElementById('notification-container');
        const settings = { ...DEFAULT_SETTINGS, ...options };
        const notifType = NOTIFICATION_TYPES[type] || NOTIFICATION_TYPES.info;
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        
        // Apply custom styling if needed
        if (notifType.bgColor) {
            notification.style.backgroundColor = notifType.bgColor;
        }
        
        if (notifType.borderColor) {
            notification.style.borderLeft = `4px solid ${notifType.borderColor}`;
        }
        
        // Create notification content with separate gradient box
        notification.innerHTML = `
            <div class="notification-gradient"></div>
            <div class="notification-icon">${notifType.icon}</div>
            <div class="notification-text">${message}</div>
            ${settings.closeButton ? '<button class="notification-close">&times;</button>' : ''}
        `;
        
        // Add to container
        container.appendChild(notification);
        
        // Generate unique ID for this notification
        const notificationId = Date.now();
        notification.dataset.id = notificationId;
        
        // Track this notification
        activeNotifications.push({
            id: notificationId,
            element: notification,
            timer: null
        });
        
        // Show notification with proper animation
        setTimeout(() => {
            notification.classList.add('show');
            
            // Release the lock after a short delay
            setTimeout(() => {
                notificationInProgress = false;
            }, 100);
            
            // Ensure notifications are stacked properly
            const index = activeNotifications.findIndex(n => n.id === notificationId);
            if (index >= 0) {
                // No need for manual transform - we're using CSS for this now
            }
        }, 10);
        
        // Add close button functionality
        if (settings.closeButton) {
            const closeBtn = notification.querySelector('.notification-close');
            closeBtn.addEventListener('click', () => {
                closeNotification(notificationId);
            });
        }
        
        // Auto-remove after duration
        if (settings.duration > 0) {
            const timer = setTimeout(() => {
                closeNotification(notificationId);
            }, settings.duration);
            
            // Update the timer in our tracking object
            const notifObj = activeNotifications.find(n => n.id === notificationId);
            if (notifObj) {
                notifObj.timer = timer;
            }
        }
        
        // Return the notification ID so it can be closed programmatically
        return notificationId;
    } catch (error) {
        console.error('Error showing notification:', error);
        notificationInProgress = false; // Make sure to release the lock if there's an error
        return null;
    }
}

/**
 * Extract track name from a success message for better deduplication
 * @param {string} message - The notification message
 * @returns {string} - The extracted track name or a hash of the message
 */
function extractTrackName(message) {
    // Try to extract the track name between quotes if they exist
    let match = message.match(/track ["'](.+?)["'] successfully/i);
    
    // If no quotes, try to extract the track name between "track" and "successfully"
    if (!match) {
        match = message.match(/track (.+?) successfully/i);
    }
    
    // Return the extracted name or a simple hash of the message
    return match ? match[1].trim() : simpleHash(message);
}

/**
 * Generate a simple hash of a string for use as a key
 * @param {string} str - String to hash
 * @returns {string} - Simple hash string
 */
function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString();
}

/**
 * Close a specific notification
 * @param {number} id - Notification ID to close
 */
export function closeNotification(id) {
    const notifObj = activeNotifications.find(n => n.id === id);
    if (!notifObj) return;
    
    const { element, timer } = notifObj;
    
    // Clear any existing timer
    if (timer) {
        clearTimeout(timer);
    }
    
    // Remove show class to trigger fade out
    element.classList.remove('show');
    
    // Remove from DOM after animation
    setTimeout(() => {
        if (element.parentNode) {
            element.parentNode.removeChild(element);
        }
        
        // Remove from tracking array
        activeNotifications = activeNotifications.filter(n => n.id !== id);
    }, 300);
}

/**
 * Close all notifications
 */
export function closeAllNotifications() {
    // Create a copy of the array since we'll be modifying the original
    const notifications = [...activeNotifications];
    
    // Close each notification
    notifications.forEach(notif => {
        closeNotification(notif.id);
    });
}

/**
 * Shorthand methods for different notification types
 */
export const notify = {
    success: (message, options) => showNotification(message, 'success', options),
    error: (message, options) => showNotification(message, 'error', options),
    info: (message, options) => showNotification(message, 'info', options),
    warning: (message, options) => showNotification(message, 'warning', options)
};

/**
 * Add basic notification styles if not defined in CSS
 * This is a fallback in case the CSS file isn't loaded
 */
function addBasicStyles() {
    const styleId = 'notification-fallback-styles';
    
    // Don't add styles if they already exist
    if (document.getElementById(styleId)) return;
    
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
        #notification-container {
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            gap: 10px;
            width: 300px;
            pointer-events: none;
        }
        
        .notification {
            background: rgba(30, 30, 30, 0.9);
            color: white;
            padding: 12px 15px;
            border-radius: 4px;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
            display: flex;
            align-items: center;
            opacity: 0;
            transition: opacity 0.3s ease;
            pointer-events: auto;
            margin-bottom: 10px;
            width: 100%;
            box-sizing: border-box;
            position: relative;
        }
        
        .notification-gradient {
            position: absolute;
            left: -10px;
            top: 0;
            bottom: 0;
            width: 10px;
            background: rgba(255, 255, 255, 0.7);
            border-top-left-radius: 4px;
            border-bottom-left-radius: 4px;
            box-shadow: 0 0 5px rgba(255, 255, 255, 0.3);
        }
        
        .notification.show {
            opacity: 1;
        }
        
        .notification-icon {
            margin-right: 15px;
            flex-shrink: 0;
        }
        
        .notification-text {
            flex: 1;
            margin-right: 10px;
            font-size: 14px;
        }
        
        .notification-close {
            background: none;
            border: none;
            color: rgba(255, 255, 255, 0.7);
            cursor: pointer;
            padding: 2px;
            margin-left: auto;
            font-size: 1.2em;
            line-height: 1;
            transition: all 0.2s;
        }
        
        .notification-close:hover {
            color: white;
        }
    `;
    
    document.head.appendChild(style);
}
