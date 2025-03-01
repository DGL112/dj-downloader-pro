import os
import tempfile
import subprocess
from mutagen.id3 import ID3, TIT2, TPE1, TALB, COMM, TBPM, TKEY

def embed_metadata_with_ffmpeg(audio_path, thumbnail_path, metadata, temp_folder):
    """Embed metadata and cover art using FFmpeg (most reliable method)."""
    output_mp3 = os.path.join(temp_folder, f"tagged_{os.path.basename(audio_path)}")
    
    cmd = [
        'ffmpeg', '-y',
        '-i', audio_path,
    ]
    
    # Add thumbnail if available
    if thumbnail_path:
        cmd.extend(['-i', thumbnail_path])
        cmd.extend(['-map', '0:0', '-map', '1:0',
                   '-c:a', 'copy', '-c:v', 'copy',
                   '-disposition:v', 'attached_pic'])
    else:
        cmd.extend(['-c:a', 'copy'])
    
    # Add metadata
    cmd.extend([
        '-id3v2_version', '3',  # v2.3 has best compatibility
        '-metadata', f'title={metadata["title"]}',
        '-metadata', f'artist={metadata["artist"]}',
        '-metadata', f'album={metadata["artist"]} - {metadata["title"]}',
        '-metadata', f'comment=BPM: {metadata["bpm"]}, Key: {metadata["key"]}',
    ])
    
    if thumbnail_path:
        cmd.extend([
            '-metadata:s:v', 'title=Album cover',
            '-metadata:s:v', 'comment=Cover (front)',
        ])
    
    cmd.append(output_mp3)
    
    try:
        # Execute FFmpeg command
        subprocess.run(cmd, check=True, capture_output=True)
        
        if os.path.exists(output_mp3) and os.path.getsize(output_mp3) > 1000:
            return {'final_path': output_mp3, 'success': True}
        else:
            return {'final_path': audio_path, 'success': False}
            
    except subprocess.CalledProcessError:
        # Fallback to simpler method if FFmpeg fails
        return embed_metadata_with_mutagen(audio_path, metadata)

def embed_metadata_with_mutagen(audio_path, metadata):
    """Embed basic metadata using mutagen (no cover art)."""
    try:
        try:
            audio_id3 = ID3(audio_path)
        except:
            audio_id3 = ID3()
        
        # Add ID3 tags
        audio_id3.add(TIT2(encoding=3, text=metadata["title"]))
        audio_id3.add(TPE1(encoding=3, text=metadata["artist"]))
        audio_id3.add(TALB(encoding=3, text=f"{metadata['artist']} - {metadata['title']}"))
        audio_id3.add(COMM(encoding=3, lang='eng', desc='desc', 
                         text=f"BPM: {metadata['bpm']}, Key: {metadata['key']}"))
        audio_id3.add(TBPM(encoding=3, text=str(metadata["bpm"])))
        audio_id3.add(TKEY(encoding=3, text=metadata["key"]))
        
        # Save with ID3v2.3 for compatibility
        audio_id3.save(audio_path, v2_version=3)
        
        return {'final_path': audio_path, 'success': True}
    except Exception as e:
        print(f"Error embedding metadata with mutagen: {e}")
        return {'final_path': audio_path, 'success': False}

def process_audio_metadata(audio_path, thumbnail_path, metadata):
    """Process audio metadata and return the path to the final file."""
    temp_folder = os.path.dirname(audio_path)
    
    # Try embedding with FFmpeg first (best for cover art)
    if thumbnail_path:
        result = embed_metadata_with_ffmpeg(audio_path, thumbnail_path, metadata, temp_folder)
        if result['success']:
            # Clean up original if we created a new file
            if result['final_path'] != audio_path and os.path.exists(audio_path):
                os.remove(audio_path)
            return result
    
    # Fall back to mutagen if FFmpeg fails or no thumbnail
    return embed_metadata_with_mutagen(audio_path, metadata)
