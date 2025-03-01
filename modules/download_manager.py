import time
import threading

# In-memory storage for download tasks
# In a production app, this would use Redis or another persistent store
download_tasks = {}

# Lock for thread-safe operations
task_lock = threading.Lock()

def store_download_info(task_id, info):
    """Store or update download task information."""
    with task_lock:
        if task_id not in download_tasks:
            # Initialize with timestamp
            download_tasks[task_id] = {
                'created_at': time.time(),
                **info
            }
        else:
            # Update existing task info
            download_tasks[task_id].update(info)
            download_tasks[task_id]['updated_at'] = time.time()

def get_download_status(task_id):
    """Get the current status of a download task."""
    with task_lock:
        task = download_tasks.get(task_id)
        if not task:
            return None
        
        # Return a status object (omitting binary data for API responses)
        status = {
            'status': task['status'],
            'progress': task['progress'],
            'message': task['message']
        }
        
        # Include metadata if available
        for key in ['artist', 'title', 'bpm', 'key']:
            if key in task:
                status[key] = task[key]
        
        return status

def get_download_result(task_id):
    """Get the result of a completed download task."""
    with task_lock:
        task = download_tasks.get(task_id)
        if not task or task.get('status') != 'completed':
            return None
        
        return {
            'data': task.get('data'),
            'filename': task.get('filename'),
            'metadata': task.get('metadata', {})
        }

def cleanup_old_tasks():
    """Remove old completed or failed tasks from memory."""
    with task_lock:
        current_time = time.time()
        task_ids = list(download_tasks.keys())
        
        for task_id in task_ids:
            task = download_tasks[task_id]
            
            # Keep completed tasks for 1 hour
            if task['status'] in ['completed', 'error']:
                if current_time - task.get('updated_at', task.get('created_at', 0)) > 3600:
                    # Clean up task data
                    del download_tasks[task_id]

# Start background thread for cleanup
def start_cleanup_scheduler():
    def cleanup_loop():
        while True:
            cleanup_old_tasks()
            time.sleep(300)  # Run every 5 minutes
    
    cleanup_thread = threading.Thread(target=cleanup_loop)
    cleanup_thread.daemon = True
    cleanup_thread.start()

# Initialize cleanup scheduler
start_cleanup_scheduler()
