#!/usr/bin/env python3
"""
DJ Downloader Pro - Launcher Script
This is a simple launcher for DJ Downloader Pro with built-in checks for dependencies.
"""

import os
import sys
import subprocess
import importlib
import platform
import webbrowser
from time import sleep

def check_dependency(module_name):
    """Check if a Python module is installed."""
    try:
        importlib.import_module(module_name)
        return True
    except ImportError:
        return False

def check_ffmpeg():
    """Check if FFmpeg is installed and in PATH."""
    try:
        subprocess.run(["ffmpeg", "-version"], stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)
        return True
    except (subprocess.SubprocessError, FileNotFoundError):
        return False

def install_dependencies():
    """Install Python dependencies from requirements.txt."""
    try:
        subprocess.run([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"], check=True)
        print("✅ Dependencies installed successfully.")
        return True
    except subprocess.SubprocessError:
        print("❌ Failed to install dependencies. Please install them manually.")
        return False

def main():
    """Main launcher function."""
    print("🎵 DJ Downloader Pro - Launcher")
    print("=" * 40)
    
    # Check Python version
    python_version = sys.version_info
    if python_version.major < 3 or (python_version.major == 3 and python_version.minor < 7):
        print("❌ Python 3.7 or higher is required.")
        sys.exit(1)
    else:
        print(f"✅ Python version: {python_version.major}.{python_version.minor}.{python_version.micro}")
    
    # Check for FFmpeg
    if not check_ffmpeg():
        print("❌ FFmpeg is required but not found in PATH.")
        if platform.system() == "Windows":
            print("   Please download it from https://ffmpeg.org/download.html and add to PATH.")
        elif platform.system() == "Darwin":  # macOS
            print("   Install it using: brew install ffmpeg")
        else:  # Linux
            print("   Install it using: sudo apt install ffmpeg (or equivalent for your distribution)")
        sys.exit(1)
    else:
        print("✅ FFmpeg is installed.")
    
    # Check required dependencies
    missing_deps = []
    critical_deps = ["flask", "librosa", "numpy", "yt_dlp", "mutagen", "requests"]
    
    for dep in critical_deps:
        if not check_dependency(dep):
            missing_deps.append(dep)
    
    # Install missing dependencies if any
    if missing_deps:
        print(f"❌ Missing dependencies: {', '.join(missing_deps)}")
        print("Attempting to install required dependencies...")
        if not install_dependencies():
            sys.exit(1)
    else:
        print("✅ All required Python dependencies are installed.")
    
    # Launch the application
    print("\n🚀 Starting DJ Downloader Pro...")
    try:
        from app import create_app
        app = create_app()
        
        # Open browser after a short delay
        def open_browser():
            sleep(1)
            # Use localhost instead of 0.0.0.0 for browser access
            browser_host = "localhost" if app.config['HOST'] == "0.0.0.0" else app.config['HOST']
            url = f"http://{browser_host}:{app.config['PORT']}"
            print(f"📱 Opening browser at {url}")
            webbrowser.open(url)
        
        # Only open browser if not in debug mode or if this is the main Flask process
        # This prevents opening browser twice when debug=True
        should_open_browser = not app.config['DEBUG'] or os.environ.get('WERKZEUG_RUN_MAIN') == 'true'
        
        if should_open_browser:
            from threading import Thread
            browser_thread = Thread(target=open_browser)
            browser_thread.daemon = True
            browser_thread.start()
        
        # Start the app
        app.run(debug=app.config['DEBUG'], host=app.config['HOST'], port=app.config['PORT'])
        
    except ImportError as e:
        print(f"❌ Error importing application: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Error starting application: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
