"""TalkDraw Flask Backend - Main Application."""
import os
import uuid
import requests
import urllib.parse
from flask import Flask, request, jsonify, send_from_directory, session
from flask_cors import CORS
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from models import init_db, User, Drawing
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'talkdraw-secret-key-change-in-production')

# Configure CORS
# Configure CORS
CORS(app, supports_credentials=True, resources={r"/api/*": {"origins": ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"]}})

# Configure Flask-Login
login_manager = LoginManager()
login_manager.init_app(app)

# Image storage directory
IMAGES_DIR = os.path.join(os.path.dirname(__file__), 'images')
os.makedirs(IMAGES_DIR, exist_ok=True)

@login_manager.user_loader
def load_user(user_id):
    return User.get_by_id(int(user_id))

# ============ AUTH ROUTES ============

@app.route('/api/auth/register', methods=['POST'])
def register():
    """Register a new user."""
    data = request.get_json()
    username = data.get('username', '').strip()
    password = data.get('password', '')
    
    if not username or not password:
        return jsonify({'error': 'Username and password required'}), 400
    
    if len(username) < 3:
        return jsonify({'error': 'Username must be at least 3 characters'}), 400
    
    if len(password) < 4:
        return jsonify({'error': 'Password must be at least 4 characters'}), 400
    
    user = User.create(username, password)
    if not user:
        return jsonify({'error': 'Username already exists'}), 409
    
    login_user(user)
    return jsonify({
        'message': 'Registration successful',
        'user': {'id': user.id, 'username': user.username}
    }), 201

@app.route('/api/auth/login', methods=['POST'])
def login():
    """Login user."""
    data = request.get_json()
    username = data.get('username', '').strip()
    password = data.get('password', '')
    
    user = User.get_by_username(username)
    if not user or not user.verify_password(password):
        return jsonify({'error': 'Invalid username or password'}), 401
    
    login_user(user)
    return jsonify({
        'message': 'Login successful',
        'user': {'id': user.id, 'username': user.username}
    })

@app.route('/api/auth/logout', methods=['POST'])
@login_required
def logout():
    """Logout user."""
    logout_user()
    return jsonify({'message': 'Logged out successfully'})

@app.route('/api/auth/me', methods=['GET'])
def get_current_user():
    """Get current logged in user."""
    if current_user.is_authenticated:
        return jsonify({
            'user': {'id': current_user.id, 'username': current_user.username}
        })
    return jsonify({'user': None})

# ============ IMAGE GENERATION ============

@app.route('/api/generate', methods=['POST'])
def generate_image():
    """Generate an image using Gemini SDK (primary) or Pollinations.AI (fallback)."""
    import time
    import random
    import base64
    
    data = request.get_json()
    prompt = data.get('prompt', '').strip()
    
    if not prompt:
        return jsonify({'error': 'Prompt is required'}), 400
    
    # Simplified prompt for faster generation
    enhanced_prompt = f"pencil sketch of {prompt}"
    
    # ============ TRY GEMINI SDK FIRST ============
    try:
        print("Attempting Gemini SDK image generation...")
        from google import genai
        
        client = genai.Client(api_key=os.environ.get('GEMINI_API_KEY'))
        
        # Use Gemini 2.5 Flash Image Preview model
        response = client.models.generate_content(
            model='gemini-2.5-flash-image-preview',
            contents=enhanced_prompt,
            config={
                'response_modalities': ['IMAGE']
            }
        )
        
        # Extract image from response
        if response.candidates and response.candidates[0].content.parts:
            for part in response.candidates[0].content.parts:
                if hasattr(part, 'inline_data') and part.inline_data:
                    image_data = base64.b64decode(part.inline_data.data)
                    
                    # Save the image locally
                    filename = f"{uuid.uuid4()}.png"
                    filepath = os.path.join(IMAGES_DIR, filename)
                    
                    with open(filepath, 'wb') as f:
                        f.write(image_data)
                    
                    print(f"Gemini image generated successfully: {filename}")
                    
                    # Auto-save to gallery
                    Drawing.create(prompt, f'/api/images/{filename}')
                    
                    return jsonify({
                        'success': True,
                        'image_url': f'/api/images/{filename}',
                        'prompt': prompt
                    })
        
        raise Exception("No image in Gemini response")
        
    except Exception as gemini_error:
        print(f"Gemini SDK failed: {gemini_error}")
        print("Falling back to Pollinations.AI...")
    
    # ============ FALLBACK TO POLLINATIONS.AI ============
    # URL encode the prompt
    encoded_prompt = urllib.parse.quote(enhanced_prompt)
    
    # Add a random seed to avoid caching issues
    seed = random.randint(1, 999999)
    
    # Pollinations.AI free image generation API - smaller image for faster loading
    image_url = f"https://image.pollinations.ai/prompt/{encoded_prompt}?width=256&height=256&nologo=true&seed={seed}"
    
    # Retry logic - try up to 2 times for faster response
    max_retries = 2
    last_error = None
    
    for attempt in range(max_retries):
        try:
            print(f"Pollinations attempt {attempt + 1}/{max_retries}: Generating image...")
            # Faster timeout
            response = requests.get(image_url, timeout=45)
            response.raise_for_status()
            
            # Save the image locally
            filename = f"{uuid.uuid4()}.png"
            filepath = os.path.join(IMAGES_DIR, filename)
            
            with open(filepath, 'wb') as f:
                f.write(response.content)
                
            print(f"Pollinations image generated successfully: {filename}")
            
            # Auto-save to gallery
            Drawing.create(prompt, f'/api/images/{filename}')
            
            return jsonify({
                'success': True,
                'image_url': f'/api/images/{filename}',
                'prompt': prompt
            })

        except requests.RequestException as e:
            last_error = e
            print(f"Pollinations attempt {attempt + 1} failed: {e}")
            if attempt < max_retries - 1:
                time.sleep(2)  # Wait before retrying
                continue
        except Exception as e:
            print(f"Unexpected Error: {e}")
            return jsonify({'error': f"Server Error: {str(e)}"}), 500
    
    # All retries failed
    print(f"All {max_retries} Pollinations attempts failed")
    return jsonify({'error': f"Image generation failed after {max_retries} attempts. Please try again."}), 500

@app.route('/api/images/<filename>')
def serve_image(filename):
    """Serve generated images."""
    return send_from_directory(IMAGES_DIR, filename)

# ============ GALLERY ============

@app.route('/api/gallery', methods=['GET'])
def get_gallery():
    """Get all drawings (public gallery)."""
    drawings = Drawing.get_all()
    return jsonify({
        'drawings': [
            {
                'id': d.id,
                'prompt': d.prompt,
                'image_url': d.image_path,
                'created_at': d.created_at
            }
            for d in drawings
        ]
    })

@app.route('/api/gallery/<int:drawing_id>', methods=['DELETE'])
def delete_from_gallery(drawing_id):
    """Delete a drawing from the gallery."""
    from models import get_db
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM drawings WHERE id = ?', (drawing_id,))
    deleted = cursor.rowcount > 0
    conn.commit()
    conn.close()
    if deleted:
        return jsonify({'message': 'Drawing deleted'})
    return jsonify({'error': 'Drawing not found'}), 404

# ============ MAIN ============

if __name__ == '__main__':
    init_db()
    print("🎨 TalkDraw Backend running on http://localhost:5000")
    app.run(debug=True, port=5000)
