from flask import Flask
import os
from modules.routes import register_routes
from modules.config import APP_CONFIG

def create_app(config=None):
    """Create and configure the Flask application."""
    app = Flask(__name__)
    
    # Apply configuration
    app.config.from_mapping(APP_CONFIG)
    if config:
        app.config.update(config)
    
    # Ensure temp directory exists
    os.makedirs(app.config['TEMP_FOLDER'], exist_ok=True)
    
    # Register routes
    register_routes(app)
    
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=app.config['DEBUG'], host=app.config['HOST'], port=app.config['PORT'])
