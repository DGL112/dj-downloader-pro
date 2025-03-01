import os
import re
import yt_dlp
import requests
import tempfile
from .config import YTDL_OPTIONS

def extract_youtube_id(url):
    """Extract YouTube video ID from URL."""
    match = re.search(r'(?:v=|\/|youtu\.be\/)([a-zA-Z0-9_-]{11})', url)
    return match.group(1) if match else None

def download_thumbnail(video_id, output_path):
    """Download video thumbnail at highest available quality."""
    if not video_id:
        return None, False
    
    thumbnail_urls = [
        f"https://img.youtube.com/vi/{video_id}/maxresdefault.jpg",
        f"https://img.youtube.com/vi/{video_id}/sddefault.jpg",
        f"https://img.youtube.com/vi/{video_id}/hqdefault.jpg",
        f"https://img.youtube.com/vi/{video_id}/0.jpg"
    ]
    
    for thumbnail_url in thumbnail_urls:
        try:
            response = requests.get(thumbnail_url, timeout=5)
            if response.status_code == 200 and len(response.content) > 1000:
                with open(output_path, 'wb') as f:
                    f.write(response.content)
                return output_path, True
        except Exception:
            continue
    
    return None, False

def parse_video_title(title, uploader):
    """Parse video title to extract artist and track title."""
    if ' - ' in title:
        parts = title.split(' - ', 1)
        artist = parts[0].strip()
        track_title = parts[1].strip()
    else:
        artist = uploader
        track_title = title
    
    return artist, track_title

def download_from_youtube(url, temp_folder):
    """Download audio from YouTube and return metadata."""
    video_id = extract_youtube_id(url)
    
    # Create temporary files
    audio_file = tempfile.NamedTemporaryFile(
        suffix=".mp3", 
        dir=temp_folder, 
        delete=False
    )
    audio_path = audio_file.name
    audio_file.close()
    
    thumbnail_path = os.path.join(temp_folder, f"{video_id}_thumbnail.jpg")
    
    # Download thumbnail
    thumbnail_result, has_thumbnail = download_thumbnail(video_id, thumbnail_path)
    
    # Configure yt-dlp
    options = YTDL_OPTIONS.copy()
    options['outtmpl'] = audio_path
    
    # Download audio
    with yt_dlp.YoutubeDL(options) as ydl:
        info = ydl.extract_info(url, download=True)
    
    # Find the actual MP3 file path (in case yt-dlp added extensions)
    base, _ = os.path.splitext(audio_path)
    mp3_path = base + ".mp3"
    
    # Extract title and artist
    vid_title = info.get('title', 'Unknown Title')
    vid_uploader = info.get('uploader', 'Unknown Artist')
    artist, title = parse_video_title(vid_title, vid_uploader)
    
    return {
        'audio_path': mp3_path,
        'artist': artist,
        'title': title,
        'thumbnail_path': thumbnail_path if has_thumbnail else None,
        'has_thumbnail': has_thumbnail,
        'video_id': video_id
    }
