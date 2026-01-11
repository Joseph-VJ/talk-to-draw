from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from werkzeug.security import generate_password_hash, check_password_hash
import sqlite3
import os
from datetime import datetime
import secrets

app = Flask(__name__)
app.secret_key = secrets.token_hex(16)

# Create necessary folders
os.makedirs('static/drawings', exist_ok=True)
os.makedirs('templates', exist_ok=True)

# Database initialization
def init_db():
    conn = sqlite3.connect('database.db')
    c = conn.cursor()
    
    # Users table
    c.execute('''CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )''')
    
    # Drawings table
    c.execute('''CREATE TABLE IF NOT EXISTS drawings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        command TEXT NOT NULL,
        image_url TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )''')
    
    conn.commit()
    conn.close()

# Initialize database on startup
init_db()

@app.route('/')
def index():
    # No authentication required - everyone can use the app
    if 'user_id' not in session:
        # Create anonymous session
        session['user_id'] = 1
        session['username'] = 'Guest'
    return render_template('index.html', username=session.get('username'))

@app.route('/api/save-drawing', methods=['POST'])
def save_drawing():
    # Ensure session exists
    if 'user_id' not in session:
        session['user_id'] = 1
    
    data = request.get_json()
    command = data.get('command')
    image_url = data.get('image_url')
    
    if not command or not image_url:
        return jsonify({'success': False, 'error': 'Missing data'}), 400
    
    conn = sqlite3.connect('database.db')
    c = conn.cursor()
    c.execute('INSERT INTO drawings (user_id, command, image_url) VALUES (?, ?, ?)',
              (session['user_id'], command, image_url))
    conn.commit()
    drawing_id = c.lastrowid
    conn.close()
    
    return jsonify({'success': True, 'id': drawing_id})

@app.route('/api/get-drawings')
def get_drawings():
    # Ensure session exists
    if 'user_id' not in session:
        session['user_id'] = 1
    
    conn = sqlite3.connect('database.db')
    c = conn.cursor()
    c.execute('''SELECT id, command, image_url, created_at 
                 FROM drawings 
                 WHERE user_id = ? 
                 ORDER BY created_at DESC''', 
              (session['user_id'],))
    drawings = c.fetchall()
    conn.close()
    
    drawings_list = []
    for d in drawings:
        drawings_list.append({
            'id': d[0],
            'command': d[1],
            'image_url': d[2],
            'created_at': d[3]
        })
    
    return jsonify({'success': True, 'drawings': drawings_list})

@app.route('/api/delete-drawing/<int:drawing_id>', methods=['DELETE'])
def delete_drawing(drawing_id):
    # Ensure session exists
    if 'user_id' not in session:
        session['user_id'] = 1
    
    conn = sqlite3.connect('database.db')
    c = conn.cursor()
    c.execute('DELETE FROM drawings WHERE id = ? AND user_id = ?', 
              (drawing_id, session['user_id']))
    conn.commit()
    conn.close()
    
    return jsonify({'success': True})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
