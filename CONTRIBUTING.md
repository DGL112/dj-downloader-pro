# Contributing to DJ Downloader Pro

Thank you for considering contributing to DJ Downloader Pro! This document provides guidelines and instructions to help you get started.

## Development Environment Setup

1. **Fork and clone the repository**
   ```bash
   git clone https://github.com/yourusername/dj-downloader-pro.git
   cd dj-downloader-pro
   ```

2. **Create a virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Make sure FFmpeg is installed and in your PATH**
   - For Windows: Download from https://ffmpeg.org/download.html and add to PATH
   - For Mac: `brew install ffmpeg`
   - For Linux: `sudo apt install ffmpeg` or equivalent

## Project Structure

The application follows a modular structure:

- **`app.py`**: Main entry point
- **`modules/`**: Backend Python modules
  - `audio_analyzer.py`: BPM and key detection
  - `config.py`: Configuration settings
  - `download_manager.py`: Download task management
  - `metadata_handler.py`: Audio metadata handling
  - `routes.py`: API endpoints
  - `youtube_downloader.py`: YouTube integration
- **`static/`**: Frontend assets
  - `css/`: Stylesheets
  - `js/`: JavaScript modules
- **`templates/`**: HTML templates

## Code Style Guidelines

- **Python**: Follow PEP 8 guidelines
- **JavaScript**: Use ES6 features and module pattern
- **HTML/CSS**: Follow BEM naming conventions for CSS classes

## Testing Your Changes

1. Run the application:
   ```bash
   python app.py
   ```

2. Access the web interface at http://localhost:5000

3. For audio analysis testing, we recommend using various music genres to ensure accurate BPM and key detection.

## Pull Request Process

1. **Create a new branch** for your feature or bugfix
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Commit your changes** with clear, descriptive commit messages
   ```bash
   git commit -m "Add feature: description of your changes"
   ```

3. **Push to your fork** and submit a pull request
   ```bash
   git push origin feature/your-feature-name
   ```

4. **Include in your PR description**:
   - What changes you've made
   - Any issues that are addressed
   - Any dependencies that were added

## Feature Requests and Bug Reports

- Use the GitHub issue tracker to submit bug reports and feature requests
- For bug reports, please include:
  - Expected behavior
  - Actual behavior
  - Steps to reproduce
  - Environment details (OS, browser, etc.)

## License

By contributing, you agree that your contributions will be licensed under the project's MIT License.

Thank you for helping improve DJ Downloader Pro!
