# 🎵 DJ Downloader Pro

> A powerful web application for DJs to download, analyze, and prepare tracks from YouTube with professional-grade tools.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
![Python 3.7+](https://img.shields.io/badge/python-3.7+-blue.svg)

![DJ Downloader Pro Interface](https://via.placeholder.com/800x450.png?text=DJ+Downloader+Pro)

## ✨ Features

- **🎬 YouTube Integration** - Download high-quality audio from any YouTube video
- **🔍 Intelligent Audio Analysis** - Automatic BPM and musical key detection
- **📊 Waveform Visualization** - Interactive waveform display with precise playback control
- **🔊 Audio Visualization** - Real-time frequency analysis and visual representation
- **📝 Metadata Management** - Automatically embeds artist, title, BPM and key information
- **🖼️ Cover Art** - Uses YouTube thumbnails as album artwork
- **⚙️ Customizable Preferences** - Personalize your workflow with saved settings

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
   python run.py
   ```

4. **Access the web interface**
   ```
   http://localhost:5000
   ```

### Required Packages

See requirements.txt for the complete list of dependencies.

## 📂 Project Structure

The application follows a modular architecture:

```
dj-downloader-pro/
├── app.py                 # App initialization
├── run.py                 # Main entry point
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
│       ├── player.js      # Audio player functionality
│       └── modules/       # Frontend JavaScript modules
│           ├── audio-player.js     # Audio playback
│           ├── audio-visualizer.js # Visual representation of audio
│           ├── notifications.js    # User notifications
│           ├── preferences.js      # User settings storage
│           └── ui-controller.js    # UI interactions
└── templates/
    └── index.html         # Main HTML template
```

## 🎮 How to Use

### Downloading Tracks

1. Paste a YouTube URL in the input field
2. Configure your desired quality and format
3. Click "Download Track" 
4. Wait for the analysis to complete

### Working with Audio

- **Playback**: Use the transport controls to play/pause/seek
- **Waveform**: Visualize the audio and frequency spectrum
- **Track Info**: View detected BPM, key, and other metadata

### Managing Metadata

- Edit track metadata including artist, title, and genre
- Preview how your tracks will appear in your music library
- Apply metadata templates for consistent organization

### Customizing Preferences

- Adjust audio analysis settings
- Customize default download options
- Set preferred file formats and quality settings

## 🔧 Technical Implementation

- **Backend**: Flask-based Python server with modular architecture
- **Audio Analysis**: Librosa library for BPM/key detection
- **Frontend**: Modern JavaScript using ES modules pattern
- **Audio Visualization**: Real-time waveform and frequency analysis
- **User Preferences**: Local storage for saving user settings
- **Notifications**: User feedback system for operations

## 🚀 Development

Interested in contributing? Great! Please check our [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 📜 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgements

- [Librosa](https://librosa.org/) - Audio analysis
- [yt-dlp](https://github.com/yt-dlp/yt-dlp) - YouTube downloading
- [Flask](https://flask.palletsprojects.com/) - Web framework

## 💬 Support

For issues, feature requests, or questions, please [open an issue](https://github.com/yourusername/dj-downloader-pro/issues).
