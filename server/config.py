# server/config.py

from datetime import timedelta
import os

from flask import Flask, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_bcrypt import Bcrypt
from flask_caching import Cache
from flask_mail import Mail

app = Flask(__name__)


app.config["CACHE_TYPE"] = "SimpleCache"
app.config["CACHE_DEFAULT_TIMEOUT"] = 300

CORS(app,
     resources={r"/api/*": {"origins": [
         "http://royalrealty.co.ke",
         "https://royalrealty.co.ke",
         "https://www.royalrealty.co.ke",
         "http://localhost:5173",
         "http://127.0.0.1:5173"
     ]}},
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
     allow_headers=[
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "X-CSRF-Token"
    ],
     supports_credentials=True,
     expose_headers=["Content-Type", "Authorization"],
     max_age=3600)
cache = Cache(app)
bcrypt = Bcrypt(app)

app.config['CORS_HEADERS'] = 'Content-Type'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///ayo.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

app.config['JWT_SECRET_KEY'] = os.getenv("JWT_SECRET_KEY", "your-32-character-minimum-secret-key-here!")
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=3)  # Use timedelta
app.config['JWT_TOKEN_LOCATION'] = ['cookies']
app.config['JWT_COOKIE_SECURE'] = False  # Set to True in production with HTTPS
app.config['JWT_COOKIE_CSRF_PROTECT'] = True
app.config['JWT_CSRF_IN_COOKIES'] = True
app.config['JWT_CSRF_CHECK_FORM'] = True
app.config['JWT_ACCESS_CSRF_HEADER_NAME'] = "X-CSRF-TOKEN"
app.config['JWT_REFRESH_CSRF_HEADER_NAME'] = "X-CSRF-TOKEN-REFRESH"
app.config['JWT_COOKIE_SAMESITE'] = 'Lax'
app.config['JWT_COOKIE_DOMAIN'] = None  
app.config['JWT_CSRF_METHODS'] = ['POST', 'PUT', 'DELETE', 'PATCH']  

app.config['MAIL_SERVER'] = os.getenv("MAIL_SERVER", "localhost")
app.config['MAIL_PORT'] = int(os.getenv("MAIL_PORT", 25))
app.config['MAIL_USERNAME'] = os.getenv("MAIL_USERNAME")
app.config['MAIL_PASSWORD'] = os.getenv("MAIL_PASSWORD")
app.config['MAIL_USE_TLS'] = os.getenv("MAIL_USE_TLS", "False") == "True"
app.config['MAIL_USE_SSL'] = os.getenv("MAIL_USE_SSL", "True") == "True"
app.config['MAIL_DEFAULT_SENDER'] = os.getenv("MAIL_DEFAULT_SENDER")


db = SQLAlchemy(app)
migrate = Migrate(app, db)
jwt = JWTManager(app)
mail = Mail(app)
