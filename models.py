
from datetime import datetime
from config import db

class Task(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'created_date': self.created_date.isoformat(),
            'due_date': self.due_date.isoformat() if self.due_date else None,
            'completed': self.completed,
            'important': self.important,
            'urgent': self.urgent
        }
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    created_date = db.Column(db.DateTime, default=datetime.utcnow)
    due_date = db.Column(db.DateTime)
    completed = db.Column(db.Boolean, default=False)
    important = db.Column(db.Boolean, default=False)
    urgent = db.Column(db.Boolean, default=False)

class JournalEntry(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=False)
    created_date = db.Column(db.DateTime, default=datetime.utcnow)
    entry_type = db.Column(db.String(50), default='Feature')

class Contact(db.Model):
    __bind_key__ = 'contacts'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    position = db.Column(db.String(100))
    email = db.Column(db.String(120))
    phones = db.Column(db.Text)  # Будем хранить телефоны как JSON строку
    department = db.Column(db.String(100))
    photo_path = db.Column(db.String(255))
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        import json
        return {
            'id': self.id,
            'name': self.name,
            'position': self.position,
            'email': self.email,
            'phones': json.loads(self.phones) if self.phones else [],
            'department': self.department,
            'photo_url': self.photo_url,
            'notes': self.notes
        }

    @property
    def photo_url(self):
        if self.photo_path:
            return f'/static/uploads/contacts/{self.photo_path}'
        return None
