from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from models import db
from routes import api_bp
import os

from datetime import timedelta
from dotenv import load_dotenv

def create_app():
    load_dotenv()
    app = Flask(__name__)
    CORS(app, supports_credentials=True, origins=["http://localhost:5173", "http://127.0.0.1:5173"])
    
    # Configure Database (SQLite for local dev, or use MySQL if DATABASE_URL is set)
    app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///splitstay.db')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # Configure JWT
    secret = os.environ.get('JWT_SECRET_KEY')
    if not secret:
        raise ValueError("No JWT_SECRET_KEY set for application")
    app.config['JWT_SECRET_KEY'] = secret
    app.config['JWT_TOKEN_LOCATION'] = ['cookies']
    app.config['JWT_COOKIE_SECURE'] = False # Set True in production with HTTPS
    app.config['JWT_COOKIE_CSRF_PROTECT'] = True
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=2)
    
    db.init_app(app)
    jwt = JWTManager(app)
    
    app.register_blueprint(api_bp, url_prefix='/api')
    
    with app.app_context():
        # This will create tables in SQLite if they don't exist
        # For MySQL, we provide schema.sql separately, but this works too.
        db.create_all()
        
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, port=5000)
