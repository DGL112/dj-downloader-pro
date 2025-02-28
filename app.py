from flask import Flask, request, jsonify, make_response, render_template
import os
import io
import numpy as np
import librosa
import yt_dlp
from mutagen.id3 import ID3, TIT2, TPE1, TBPM, TKEY, APIC, TALB, COMM
from tempfile import NamedTemporaryFile

app = Flask(__name__)

# ----------- KEY PROFILES -----------
major_profile = np.array([6.35, 2.23, 3.48, 2.33, 4.38, 4.32, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88])
minor_profile = np.array([6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17])
keys_list = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

def detect_key(chroma):
    """Detect musical key using chromagram correlation with key profiles."""
    chroma_sum = np.sum(chroma, axis=1)
    major_corrs = [np.corrcoef(np.roll(major_profile, i), chroma_sum)[0,1] for i in range(12)]
    minor_corrs = [np.corrcoef(np.roll(minor_profile, i), chroma_sum)[0,1] for i in range(12)]
    max_major = max(major_corrs)
    max_minor = max(minor_corrs)

    if max_major > max_minor:
        key_idx = major_corrs.index(max_major)
        return f"{keys_list[key_idx]} Major"
    else:
        key_idx = minor_corrs.index(max_minor)
        return f"{keys_list[key_idx]} Minor"

def analyze_audio(file_path):
    """Analyze MP3 file to detect BPM and Key."""
    try:
        y, sr = librosa.load(file_path, sr=None)
        tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
        # tempo might be a numpy array; ensure it's a single float
        if isinstance(tempo, (list, np.ndarray)):
            tempo = float(tempo[0])
        else:
            tempo = float(tempo)

        chroma = librosa.feature.chroma_cqt(y=y, sr=sr)
        key_detected = detect_key(chroma)
        return key_detected, int(round(tempo))
    except Exception as exc:
        print("Error analyzing audio:", exc)
        return "Unknown", 0

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/download', methods=['POST'])
def download_route():
    """Download from YouTube, analyze (BPM/Key), embed album cover, and send MP3 with custom headers."""
    url = request.form.get('url', '')
    if not url:
        return jsonify({"error": "No URL provided"}), 400

    try:
        # Extract video ID for direct thumbnail access
        import re
        video_id = None
        match = re.search(r'(?:v=|\/|youtu\.be\/)([a-zA-Z0-9_-]{11})', url)
        if match:
            video_id = match.group(1)
            print(f"Extracted video ID: {video_id}")
        else:
            print("Could not extract video ID from URL")

        # Create temp files
        with NamedTemporaryFile(suffix=".mp3", delete=False) as tmp_audio:
            audio_path = tmp_audio.name
        
        with NamedTemporaryFile(suffix=".jpg", delete=False) as tmp_thumb:
            thumb_path = tmp_thumb.name

        # Download the highest quality thumbnail directly from YouTube if we have a video ID
        has_cover = False
        if video_id:
            # Try multiple thumbnail qualities in order from highest to lowest
            thumbnail_urls = [
                f"https://img.youtube.com/vi/{video_id}/maxresdefault.jpg",
                f"https://img.youtube.com/vi/{video_id}/sddefault.jpg",
                f"https://img.youtube.com/vi/{video_id}/hqdefault.jpg",
                f"https://img.youtube.com/vi/{video_id}/0.jpg"
            ]
            
            import requests
            for thumbnail_url in thumbnail_urls:
                try:
                    # Direct download of thumbnail to jpg
                    print(f"Attempting to download thumbnail: {thumbnail_url}")
                    response = requests.get(thumbnail_url, timeout=5)
                    if response.status_code == 200 and len(response.content) > 1000:  # Ensure it's a valid image
                        with open(thumb_path, 'wb') as f:
                            f.write(response.content)
                        print(f"Successfully downloaded thumbnail, size: {len(response.content)} bytes")
                        has_cover = True
                        break
                except Exception as e:
                    print(f"Error downloading thumbnail {thumbnail_url}: {str(e)}")
                    continue

        # YT-DLP config - simple, just get the audio without handling thumbnails
        ydl_opts = {
            'format': 'bestaudio/best',
            'outtmpl': audio_path,
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

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            print("Downloading audio...")
            info = ydl.extract_info(url, download=True)
            print("Audio download complete")

        # Find the actual MP3 file path
        base, _ = os.path.splitext(audio_path)
        final_mp3_path = base + ".mp3"
        
        # Extract basic metadata from the video
        vid_title = info.get('title', 'Unknown Title')
        vid_uploader = info.get('uploader', 'Unknown Artist')
        if ' - ' in vid_title:
            parts = vid_title.split(' - ', 1)
            artist = parts[0].strip()
            track_title = parts[1].strip()
        else:
            artist = vid_uploader
            track_title = vid_title

        # Analyze BPM & Key
        print("Analyzing audio for BPM and key...")
        key_detected, bpm_val = analyze_audio(final_mp3_path)
        print(f"Analysis complete - Key: {key_detected}, BPM: {bpm_val}")

        # IMPORTANT: Create a new output file rather than modifying the original
        # This helps prevent issues with some players
        output_mp3 = final_mp3_path + ".tagged.mp3"
        
        if has_cover:
            # Use FFmpeg directly - creates a new file with all tags and cover art
            # This is the most reliable method for embedding cover art
            cmd = [
                'ffmpeg', '-y',
                '-i', final_mp3_path,
                '-i', thumb_path,
                '-map', '0:0',
                '-map', '1:0',
                '-c:a', 'copy',
                '-c:v', 'copy',
                '-id3v2_version', '3',  # v2.3 has the best compatibility
                '-metadata', f'title={track_title}',
                '-metadata', f'artist={artist}',
                '-metadata', f'album={artist} - {track_title}',
                '-metadata', f'comment=BPM: {bpm_val}, Key: {key_detected}',
                '-metadata:s:v', 'title=Album cover',
                '-metadata:s:v', 'comment=Cover (front)',
                '-disposition:v', 'attached_pic',
                output_mp3
            ]
            
            print("Embedding album art with FFmpeg...")
            cmd_str = ' '.join(f'"{arg}"' if ' ' in str(arg) else str(arg) for arg in cmd)
            print(f"Executing: {cmd_str}")
            os.system(cmd_str)
            
            if os.path.exists(output_mp3) and os.path.getsize(output_mp3) > 1000:
                print(f"Successfully created tagged MP3 with cover art: {output_mp3}")
                # Use the new file instead of the original
                os.remove(final_mp3_path)
                os.rename(output_mp3, final_mp3_path)
            else:
                print("Error: FFmpeg failed to create a valid output file")
        else:
            print("No cover art available, adding basic metadata only")
            # Just add basic metadata without cover art
            try:
                from mutagen.id3 import ID3, TIT2, TPE1, TALB, COMM
                try:
                    audio_id3 = ID3(final_mp3_path)
                except:
                    audio_id3 = ID3()
                
                audio_id3.add(TIT2(encoding=3, text=track_title))
                audio_id3.add(TPE1(encoding=3, text=artist))
                audio_id3.add(TALB(encoding=3, text=f"{artist} - {track_title}"))
                audio_id3.add(COMM(encoding=3, lang='eng', desc='desc', text=f"BPM: {bpm_val}, Key: {key_detected}"))
                
                # Save with ID3v2.3 for maximum compatibility
                audio_id3.save(final_mp3_path, v2_version=3)
                print("Basic metadata added successfully")
            except Exception as e:
                print(f"Error adding basic metadata: {str(e)}")

        # Read the final MP3 into memory
        print("Reading final MP3 into memory...")
        with open(final_mp3_path, 'rb') as f_mp3:
            mp3_data = f_mp3.read()
        print(f"Read {len(mp3_data)} bytes of MP3 data")

        # Clean up temp files
        if os.path.exists(final_mp3_path):
            os.remove(final_mp3_path)
        if os.path.exists(thumb_path):
            os.remove(thumb_path)

        # Build response with custom headers
        print("Preparing HTTP response...")
        response = make_response(mp3_data)
        response.headers["Content-Type"] = "audio/mpeg"
        # Force file download
        filename_out = f"{artist} - {track_title}.mp3"
        response.headers["Content-Disposition"] = f'attachment; filename="{filename_out}"'
        # Provide custom headers for front-end
        response.headers["X-Artist"] = artist
        response.headers["X-Title"]  = track_title
        response.headers["X-Bpm"]    = str(bpm_val)
        response.headers["X-Key"]    = key_detected
        response.headers["X-Has-Cover"] = "true" if has_cover else "false"
        
        print(f"Download complete: {artist} - {track_title}")
        return response

    except Exception as e:
        print(f"ERROR in download_route: {str(e)}")
        # Clean up on error
        if 'audio_path' in locals() and os.path.exists(audio_path):
            os.remove(audio_path)
        if 'thumb_path' in locals() and os.path.exists(thumb_path):
            os.remove(thumb_path)
        if 'final_mp3_path' in locals() and os.path.exists(final_mp3_path):
            os.remove(final_mp3_path)
        if 'output_mp3' in locals() and os.path.exists(output_mp3):
            os.remove(output_mp3)
        
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
