from flask import request, jsonify, make_response, render_template
import uuid
import os
import threading
import logging
from .youtube_downloader import download_from_youtube
from .audio_analyzer import analyze_audio_file
from .metadata_handler import process_audio_metadata
from .download_manager import get_download_status, store_download_info, get_download_result

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("dj_downloader.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Dictionary to store download tasks and their status
download_tasks = {}

def register_routes(app):
    """Register all application routes."""
    
    @app.route('/')
    def index():
        return render_template('index.html')
    
    @app.route('/api/download', methods=['POST'])
    def start_download():
        """Start a new download task."""
        url = request.form.get('url', '')
        if not url:
            logger.warning("Download attempt with no URL provided")
            return jsonify({"error": "No URL provided"}), 400
        
        logger.info(f"Starting download process for URL: {url}")
        
        # Generate a unique task ID
        task_id = str(uuid.uuid4())
        
        # Store initial task status
        store_download_info(task_id, {
            'status': 'queued',
            'url': url,
            'progress': 0,
            'message': 'Download queued'
        })
        
        # Start download process in background thread
        thread = threading.Thread(
            target=process_download_task,
            args=(app, task_id, url)
        )
        thread.daemon = True
        thread.start()
        
        logger.info(f"Task queued with ID: {task_id}")
        return jsonify({
            'task_id': task_id,
            'status': 'queued',
            'message': 'Download has been queued.'
        })
    
    @app.route('/api/status/<task_id>', methods=['GET'])
    def check_status(task_id):
        """Check the status of a download task."""
        logger.debug(f"Status check for task: {task_id}")
        status = get_download_status(task_id)
        if not status:
            logger.warning(f"Status check for unknown task: {task_id}")
            return jsonify({'error': 'Task not found'}), 404
        
        return jsonify(status)
    
    @app.route('/api/download/<task_id>', methods=['GET'])
    def get_download(task_id):
        """Get the completed download file."""
        logger.info(f"Download request for task: {task_id}")
        result = get_download_result(task_id)
        if not result:
            logger.warning(f"Download request for incomplete or unknown task: {task_id}")
            return jsonify({'error': 'Download not found or not complete'}), 404
        
        response = make_response(result['data'])
        response.headers["Content-Type"] = "audio/mpeg"
        response.headers["Content-Disposition"] = f'attachment; filename="{result["filename"]}"'
        
        # Set custom headers with track info
        for key, value in result['metadata'].items():
            response.headers[f"X-{key}"] = str(value)
        
        logger.info(f"Serving download for task: {task_id}, file: {result['filename']}")
        return response
        
    @app.errorhandler(404)
    def not_found_error(error):
        logger.warning(f"404 error: {request.path}")
        return jsonify({'error': 'Resource not found'}), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        logger.error(f"500 error: {str(error)}")
        return jsonify({'error': 'Internal server error'}), 500

def process_download_task(app, task_id, url):
    """Process a download task in the background."""
    logger = logging.getLogger(f"task_{task_id}")
    
    try:
        logger.info(f"Starting task processing for URL: {url}")
        
        # Update status to downloading
        store_download_info(task_id, {
            'status': 'downloading',
            'progress': 10,
            'message': 'Downloading audio from YouTube...'
        })
        
        # Download from YouTube
        logger.info("Downloading from YouTube...")
        download_result = download_from_youtube(url, app.config['TEMP_FOLDER'])
        
        # Update status to analyzing
        logger.info("Download complete, starting audio analysis...")
        store_download_info(task_id, {
            'status': 'analyzing',
            'progress': 50,
            'message': 'Analyzing audio for BPM and key...',
            'artist': download_result['artist'],
            'title': download_result['title']
        })
        
        # Analyze audio
        audio_path = download_result['audio_path']
        analysis_result = analyze_audio_file(audio_path)
        logger.info(f"Audio analysis complete: BPM={analysis_result['bpm']}, Key={analysis_result['key']}")
        
        # Update status to processing
        store_download_info(task_id, {
            'status': 'processing',
            'progress': 75,
            'message': 'Processing metadata and finalizing...',
            'bpm': analysis_result['bpm'],
            'key': analysis_result['key']
        })
        
        # Process metadata and prepare final file
        final_result = process_audio_metadata(
            audio_path,
            download_result.get('thumbnail_path'),
            {
                'artist': download_result['artist'],
                'title': download_result['title'],
                'bpm': analysis_result['bpm'],
                'key': analysis_result['key'],
            }
        )
        
        # Read file into memory
        with open(final_result['final_path'], 'rb') as f:
            audio_data = f.read()
        
        # Clean up temporary files
        os.remove(final_result['final_path'])
        if os.path.exists(download_result.get('thumbnail_path', '')):
            os.remove(download_result['thumbnail_path'])
        
        # Store result for download
        store_download_info(task_id, {
            'status': 'completed',
            'progress': 100,
            'message': 'Download ready',
            'data': audio_data,
            'filename': f"{download_result['artist']} - {download_result['title']}.mp3",
            'metadata': {
                'Artist': download_result['artist'],
                'Title': download_result['title'],
                'Bpm': analysis_result['bpm'],
                'Key': analysis_result['key'],
                'Has-Cover': 'true' if download_result.get('has_thumbnail', False) else 'false'
            }
        })
        
        # Send download success notification
        send_download_success_notification({
            'artist': download_result['artist'],
            'title': download_result['title']
        })
    
    except Exception as e:
        # Update status to error
        store_download_info(task_id, {
            'status': 'error',
            'progress': 0,
            'message': f'Error: {str(e)}'
        })
        logger.error(f"Error processing task {task_id}: {str(e)}")

def send_download_success_notification(track_info):
    """
    Send a download success notification, ensuring no duplicates.
    
    Args:
        track_info (dict): Information about the downloaded track
        
    Returns:
        None
    """
    # Format the message - use a consistent format to help client-side deduplication
    artist = track_info.get('artist', 'Unknown Artist')
    title = track_info.get('title', 'Unknown Title')
    
    # Changed message to use "analyzed" instead of "downloaded"
    message = f'Track "{artist} - {title}" successfully analyzed'
    
    # Include this message in the response rather than sending a separate notification
    return {
        "status": "success",
        "message": message,
        "notification": {
            "type": "success",
            "text": message
        }
    }
