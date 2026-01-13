"""Database models for TalkDraw application."""
import sqlite3
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash

DATABASE = 'talkdraw.db'

def get_db():
    """Get database connection."""
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initialize database tables."""
    conn = get_db()
    cursor = conn.cursor()
    
    # Users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Drawings table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS drawings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            prompt TEXT NOT NULL,
            image_path TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    conn.commit()
    conn.close()

class User:
    """User model for authentication."""
    
    def __init__(self, id=None, username=None, password_hash=None, created_at=None):
        self.id = id
        self.username = username
        self.password_hash = password_hash
        self.created_at = created_at
        self.is_authenticated = True
        self.is_active = True
        self.is_anonymous = False
    
    def get_id(self):
        return str(self.id)
    
    @staticmethod
    def create(username, password):
        """Create a new user."""
        conn = get_db()
        cursor = conn.cursor()
        password_hash = generate_password_hash(password)
        try:
            cursor.execute(
                'INSERT INTO users (username, password_hash) VALUES (?, ?)',
                (username, password_hash)
            )
            conn.commit()
            user_id = cursor.lastrowid
            conn.close()
            return User(id=user_id, username=username, password_hash=password_hash)
        except sqlite3.IntegrityError:
            conn.close()
            return None
    
    @staticmethod
    def get_by_username(username):
        """Get user by username."""
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM users WHERE username = ?', (username,))
        row = cursor.fetchone()
        conn.close()
        if row:
            return User(
                id=row['id'],
                username=row['username'],
                password_hash=row['password_hash'],
                created_at=row['created_at']
            )
        return None
    
    @staticmethod
    def get_by_id(user_id):
        """Get user by ID."""
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM users WHERE id = ?', (user_id,))
        row = cursor.fetchone()
        conn.close()
        if row:
            return User(
                id=row['id'],
                username=row['username'],
                password_hash=row['password_hash'],
                created_at=row['created_at']
            )
        return None
    
    def verify_password(self, password):
        """Verify password."""
        return check_password_hash(self.password_hash, password)

class Drawing:
    """Drawing model for gallery."""
    
    def __init__(self, id=None, user_id=None, prompt=None, image_path=None, created_at=None):
        self.id = id
        self.user_id = user_id
        self.prompt = prompt
        self.image_path = image_path
        self.created_at = created_at
    
    @staticmethod
    def create(prompt, image_path, user_id=None):
        """Save a new drawing (user_id is optional now)."""
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute(
            'INSERT INTO drawings (user_id, prompt, image_path) VALUES (?, ?, ?)',
            (user_id or 0, prompt, image_path)
        )
        conn.commit()
        drawing_id = cursor.lastrowid
        conn.close()
        return Drawing(id=drawing_id, user_id=user_id, prompt=prompt, image_path=image_path)
    
    @staticmethod
    def get_all():
        """Get all drawings (public gallery)."""
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM drawings ORDER BY created_at DESC')
        rows = cursor.fetchall()
        conn.close()
        return [
            Drawing(
                id=row['id'],
                user_id=row['user_id'],
                prompt=row['prompt'],
                image_path=row['image_path'],
                created_at=row['created_at']
            )
            for row in rows
        ]
    
    @staticmethod
    def get_by_user(user_id):
        """Get all drawings for a user."""
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute(
            'SELECT * FROM drawings WHERE user_id = ? ORDER BY created_at DESC',
            (user_id,)
        )
        rows = cursor.fetchall()
        conn.close()
        return [
            Drawing(
                id=row['id'],
                user_id=row['user_id'],
                prompt=row['prompt'],
                image_path=row['image_path'],
                created_at=row['created_at']
            )
            for row in rows
        ]
    
    @staticmethod
    def get_by_id(drawing_id):
        """Get drawing by ID."""
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM drawings WHERE id = ?', (drawing_id,))
        row = cursor.fetchone()
        conn.close()
        if row:
            return Drawing(
                id=row['id'],
                user_id=row['user_id'],
                prompt=row['prompt'],
                image_path=row['image_path'],
                created_at=row['created_at']
            )
        return None
    
    @staticmethod
    def delete(drawing_id, user_id):
        """Delete a drawing (only by owner)."""
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute(
            'DELETE FROM drawings WHERE id = ? AND user_id = ?',
            (drawing_id, user_id)
        )
        deleted = cursor.rowcount > 0
        conn.commit()
        conn.close()
        return deleted
