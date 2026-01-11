from flask import Flask, render_template, request, jsonify, session
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

def get_db_connection():
    conn = sqlite3.connect('database.db')
    conn.row_factory = sqlite3.Row
    return conn

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
    
    command = request.form.get('command')
    image_file = request.files.get('image')
    
    if not command or not image_file:
        return jsonify({'success': False, 'error': 'Missing data'}), 400
    
    # Save the file
    filename = f"{datetime.now().strftime('%Y%m%d_%H%M%S')}_{secrets.token_hex(4)}.png"
    filepath = os.path.join('static/drawings', filename)

    try:
        image_file.save(filepath)
    except Exception as e:
        return jsonify({'success': False, 'error': f'Failed to save file: {str(e)}'}), 500

    # URL to access the image
    image_url = f"/static/drawings/{filename}"

    conn = get_db_connection()
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
    
    conn = get_db_connection()
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
            'id': d['id'],
            'command': d['command'],
            'image_url': d['image_url'],
            'created_at': d['created_at']
        })
    
    return jsonify({'success': True, 'drawings': drawings_list})

@app.route('/api/delete-drawing/<int:drawing_id>', methods=['DELETE'])
def delete_drawing(drawing_id):
    # Ensure session exists
    if 'user_id' not in session:
        session['user_id'] = 1
    
    conn = get_db_connection()
    c = conn.cursor()

    # Get image details first to delete the file
    c.execute('SELECT image_url FROM drawings WHERE id = ? AND user_id = ?',
              (drawing_id, session['user_id']))
    row = c.fetchone()

    if row:
        image_url = row['image_url']
        # Convert URL to file path (remove leading /)
        if image_url.startswith('/'):
            file_path = image_url.lstrip('/')
            if os.path.exists(file_path):
                try:
                    os.remove(file_path)
                except OSError as e:
                    print(f"Error deleting file {file_path}: {e}")

        # Delete from DB
        c.execute('DELETE FROM drawings WHERE id = ? AND user_id = ?',
                  (drawing_id, session['user_id']))
        conn.commit()

    conn.close()
    
    return jsonify({'success': True})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
