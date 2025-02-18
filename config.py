
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class Config:
    SQLALCHEMY_DATABASE_URI = 'sqlite:///tasks.db'
    SQLALCHEMY_BINDS = {
        'contacts': 'sqlite:///contacts.db'
    }
    SECRET_KEY = 'your-secret-key'
