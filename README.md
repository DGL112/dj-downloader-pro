# 🎵 DJ Downloader Pro

> A powerful web application for DJs to download, analyze, and prepare tracks from YouTube with professional-grade tools.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
![Python 3.7+](https://img.shields.io/badge/python-3.7+-blue.svg)

![DJ Downloader Pro Interface](https://via.placeholder.com/800x450.png?text=DJ+Downloader+Pro)

## ✨ Features

- **🎬 YouTube Integration** - Download high-quality audio from any YouTube video
- **🔍 Intelligent Audio Analysis** - Automatic BPM and musical key detection
- **📊 Waveform Visualization** - Interactive waveform display with precise playback control
- **📍 Hot Cue System** - Set, manage and export cue points for DJ software
- **📝 Metadata Management** - Automatically embeds artist, title, BPM and key information
- **🖼️ Cover Art** - Uses YouTube thumbnails as album artwork
- **🔄 DJ Software Export** - Compatible with Rekordbox XML format

## 🚀 Getting Started

### Prerequisites

- Python 3.7 or newer
- FFmpeg installed and in your PATH
- Modern web browser

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/dj-downloader-pro.git
   cd dj-downloader-pro
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Launch the application**
   ```bash
   python app.py
   ```

4. **Access the web interface**
   ```
   http://localhost:5000
   ```

### Required Packages

- Flask - Web framework
- NumPy - Numerical processing
- Librosa - Audio analysis
- yt-dlp - YouTube downloading
- Mutagen - Metadata handling
- Requests - HTTP operations

## 📂 Project Structure

The application is organized into a modular structure for better maintainability:

```
dj-downloader-pro/
├── app.py                 # Main entry point
├── modules/               # Backend Python modules
│   ├── __init__.py
│   ├── audio_analyzer.py  # BPM and key detection
│   ├── config.py          # Application configuration
│   ├── download_manager.py # Task management
│   ├── metadata_handler.py # ID3 tag handling
│   ├── routes.py          # API endpoints
│   └── youtube_downloader.py # YouTube integration
├── static/
│   ├── css/
│   │   ├── styles.css     # Main styles
│   │   └── additions.css  # Enhanced UI elements
│   └── js/
│       ├── app.js         # Main frontend application
│       └── modules/       # Frontend JavaScript modules
│           ├── audio-player.js   # Audio playback
│           ├── preferences.js    # User settings storage
│           └── ui-controller.js  # UI interactions
└── templates/
    └── index.html         # Main HTML template
```

## 🎮 How to Use

### Downloading Tracks

1. Paste a YouTube URL in the input field
2. Click "Download Track" 
3. Wait for the analysis to complete

### Working with Audio

- **Playback**: Use the transport controls to play/pause/seek
- **Waveform**: Visualize the audio with beat grid overlay
- **Track Info**: View detected BPM, key, and other metadata

### Managing Hot Cues

- Click "Add Cue" to set a hot cue at the current playback position
- Click on any hot cue marker to instantly jump to that position
- Edit or delete hot cues from the management panel

### Exporting

- **DJ Software**: Generate Rekordbox XML with all hot cues and track data
- **Audio Files**: Download the processed MP3 with embedded metadata and artwork

## 🔧 Technical Implementation

- **Backend**: Flask-based Python server with modular architecture
- **Audio Analysis**: Librosa library for BPM/key detection and waveform generation
- **Frontend**: Modern JavaScript using ES modules for clean separation of concerns
- **User Preferences**: Local storage for saving volume, waveform visibility settings
- **Task Management**: Background processing with progress feedback

## 🧩 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Main application interface |
| `/api/download` | POST | Start download process |
| `/api/status/<task_id>` | GET | Check download status |
| `/api/download/<task_id>` | GET | Get completed download |

## 📜 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgements

- [Librosa](https://librosa.org/) - Advanced audio analysis
- [yt-dlp](https://github.com/yt-dlp/yt-dlp) - Reliable YouTube downloading
- [Feather Icons](https://feathericons.com/) - Beautiful UI icons

## 💬 Support

For issues, feature requests, or questions, please [open an issue](https://github.com/yourusername/dj-downloader-pro/issues).
