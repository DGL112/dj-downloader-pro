import os
import tempfile

# Base directory
BASE_DIR = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))

# Application configuration
APP_CONFIG = {
    'DEBUG': True,
    'HOST': '0.0.0.0',
    'PORT': 5000,
    'TEMP_FOLDER': os.path.join(tempfile.gettempdir(), 'dj-downloader-pro'),
    'CACHE_DURATION': 3600,  # Cache downloads for 1 hour (in seconds)
    'MAX_CONTENT_LENGTH': 500 * 1024 * 1024  # 500MB max upload size
}

# YouTube downloader settings
YTDL_OPTIONS = {
    'format': 'bestaudio/best',
    'windowsfilenames': True,
    'final_ext': 'mp3',
    'overwrites': True,
    'postprocessors': [
        {
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'mp3',
            'preferredquality': '192'
        }
    ],
}

# Audio analysis settings
AUDIO_ANALYSIS = {
    'sr': 22050,  # Sample rate for analysis
    'hop_length': 512,  # Hop length for feature extraction
    'use_cache': True  # Cache analysis results
}
