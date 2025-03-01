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

- **Backend**: Flask-based Python server handling downloads and analysis
- **Audio Analysis**: Librosa library for BPM/key detection and waveform generation
- **Frontend**: Modern JavaScript with Web Audio API for playback and visualization
- **Data Processing**: FFmpeg for audio conversion and metadata embedding

## 📜 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgements

- [Librosa](https://librosa.org/) - Advanced audio analysis
- [yt-dlp](https://github.com/yt-dlp/yt-dlp) - Reliable YouTube downloading
- [Feather Icons](https://feathericons.com/) - Beautiful UI icons

## 💬 Support

For issues, feature requests, or questions, please [open an issue](https://github.com/yourusername/dj-downloader-pro/issues).
