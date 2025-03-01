import numpy as np
import librosa
from .config import AUDIO_ANALYSIS

# Key detection profiles
MAJOR_PROFILE = np.array([6.35, 2.23, 3.48, 2.33, 4.38, 4.32, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88])
MINOR_PROFILE = np.array([6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17])
KEYS_LIST = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

# Cache for analysis results
analysis_cache = {}

def detect_key(chroma):
    """Detect musical key using chromagram correlation with key profiles."""
    chroma_sum = np.sum(chroma, axis=1)
    
    # Correlate with major and minor profiles
    major_corrs = [np.corrcoef(np.roll(MAJOR_PROFILE, i), chroma_sum)[0,1] for i in range(12)]
    minor_corrs = [np.corrcoef(np.roll(MINOR_PROFILE, i), chroma_sum)[0,1] for i in range(12)]
    
    max_major = max(major_corrs)
    max_minor = max(minor_corrs)
    
    # Return the key with highest correlation
    if max_major > max_minor:
        key_idx = major_corrs.index(max_major)
        return f"{KEYS_LIST[key_idx]} Major"
    else:
        key_idx = minor_corrs.index(max_minor)
        return f"{KEYS_LIST[key_idx]} Minor"

def analyze_audio_file(file_path):
    """Analyze an audio file to extract BPM and musical key."""
    # Check cache first if enabled
    if AUDIO_ANALYSIS['use_cache'] and file_path in analysis_cache:
        return analysis_cache[file_path]
    
    try:
        # Load audio with specified sample rate
        y, sr = librosa.load(
            file_path, 
            sr=AUDIO_ANALYSIS['sr']
        )
        
        # Calculate tempo (BPM)
        tempo, _ = librosa.beat.beat_track(
            y=y, 
            sr=sr, 
            hop_length=AUDIO_ANALYSIS['hop_length']
        )
        
        # Ensure tempo is a scalar
        if isinstance(tempo, (list, np.ndarray)):
            tempo = float(tempo[0])
        else:
            tempo = float(tempo)
        
        # Calculate chromagram for key detection
        chroma = librosa.feature.chroma_cqt(y=y, sr=sr)
        key_detected = detect_key(chroma)
        
        result = {
            'bpm': int(round(tempo)),
            'key': key_detected
        }
        
        # Cache the result
        if AUDIO_ANALYSIS['use_cache']:
            analysis_cache[file_path] = result
            
        return result
        
    except Exception as e:
        print(f"Error analyzing audio: {e}")
        return {
            'bpm': 0,
            'key': 'Unknown'
        }
