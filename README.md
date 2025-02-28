DGL112: @workspace Write the README.md file using the current workspace in markdown format

Workspace: Collecting workspace information# DJ Downloader Pro

A web application that helps DJs download tracks from YouTube with automatic BPM and musical key detection. The app includes a waveform player with beat grid visualization and hot cue functionality, making it easier to prepare tracks for DJ sets.

![DJ Downloader Pro Interface](https://via.placeholder.com/800x450.png?text=DJ+Downloader+Pro)

## Features

- **YouTube Download**: Download tracks from YouTube URLs
- **Audio Analysis**: Automatic detection of BPM (tempo) and musical key
- **Metadata Embedding**: Embeds artist, title, BPM, and key information into the MP3 file
- **Album Cover**: Automatically retrieves and embeds YouTube thumbnail as album art
- **Waveform Visualization**: Interactive waveform display with playback controls
- **Beat Grid**: Visual beat grid overlay based on detected BPM
- **Hot Cue System**: Set and manage hot cues for important track sections
- **Rekordbox Export**: Export hot cues in Rekordbox XML format

## Installation

### Prerequisites

- Python 3.7+
- FFmpeg (for audio processing)
- Required Python packages (install using `pip install -r requirements.txt`):
  - Flask
  - NumPy
  - Librosa
  - yt-dlp
  - Mutagen
  - Requests

### Setup

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/dj-downloader-pro.git
   cd dj-downloader-pro
   ```

2. Install the required dependencies:
   ```
   pip install -r requirements.txt
   ```

3. Ensure FFmpeg is installed on your system and accessible in your PATH.

4. Start the application:
   ```
   python app.py
   ```

5. Open your browser and navigate to:
   ```
   http://localhost:5000
   ```

## Usage

1. **Download a Track**:
   - Paste a YouTube URL in the input field and click "Download Track"
   - The application will download the audio, analyze it for BPM and key, and embed metadata

2. **Play and Analyze the Track**:
   - Use the player controls to play/pause the track
   - View the waveform visualization with beat grid overlay
   - See track details like artist, title, BPM, and musical key

3. **Work with Hot Cues**:
   - Click "Add Cue" to create a hot cue at the current playback position
   - Use the hot cue markers to quickly jump to important parts of the track
   - Delete unwanted cues from the hot cues list

4. **Export for DJ Software**:
   - Click "Export to Rekordbox" to generate an XML file with all your hot cues
   - Import this XML into Rekordbox or other compatible DJ software

5. **Download the Processed MP3**:
   - Click "Download MP3" to save the processed file with all metadata embedded

## Technical Details

- Built with Flask (Python web framework)
- Uses Librosa for audio analysis (BPM and key detection)
- Implements Web Audio API for waveform visualization and audio playback
- Leverages yt-dlp for reliable YouTube downloading
- Utilizes FFmpeg for audio conversion and metadata embedding

## License

MIT License

## Acknowledgements

- Audio analysis powered by [Librosa](https://librosa.org/)
- YouTube downloading functionality uses [yt-dlp](https://github.com/yt-dlp/yt-dlp)
- Icons provided by [Feather Icons](https://feathericons.com/)
