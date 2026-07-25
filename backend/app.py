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
    # Configure CORS to accept requests from frontend (local or production)
    frontend_url = os.environ.get('FRONTEND_URL', 'http://localhost:5173')
    CORS(app, supports_credentials=True, origins=[frontend_url, "http://127.0.0.1:5173", "http://localhost:5173"])
    
    # Configure Database (SQLite for local dev, or Postgres/MySQL for production)
    db_url = os.environ.get('DATABASE_URL', 'sqlite:///splitstay.db')
    # Render sometimes provides 'postgres://' which SQLAlchemy doesn't like. Needs 'postgresql://'
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)
        
    app.config['SQLALCHEMY_DATABASE_URI'] = db_url
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # Configure JWT
    secret = os.environ.get('JWT_SECRET_KEY')
    if not secret:
        raise ValueError("No JWT_SECRET_KEY set for application")
    app.config['JWT_SECRET_KEY'] = secret
    app.config['JWT_TOKEN_LOCATION'] = ['cookies']
    is_prod = os.environ.get('RENDER') is not None or os.environ.get('FLASK_ENV') == 'production'
    app.config['JWT_COOKIE_SECURE'] = is_prod
    app.config['JWT_COOKIE_SAMESITE'] = "None" if is_prod else "Lax"
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

# Expose app globally for Gunicorn (e.g. gunicorn app:app)
app = create_app()

if __name__ == '__main__':
    app.run(debug=True, port=5000)
