# 🎨 TalkDraw - AI Drawing Magic

**TalkDraw** is an interactive AI-powered drawing application that transforms your voice or text prompts into stunning pencil sketch artwork in real-time. Watch as the AI "draws" your ideas with an animated pencil cursor effect!

![TalkDraw Demo](Gemini_Generated_Image_6nagon6nagon6nag.png)

---

## ✨ Features

- **🎙️ Voice Input** - Speak your drawing ideas using voice commands
- **⌨️ Text Input** - Type prompts to describe what you want to draw
- **✏️ Real-time Drawing Animation** - Watch a pencil cursor animate while the AI generates your artwork
- **🖼️ Gallery** - All generated drawings are automatically saved to a gallery
- **🎨 Pencil Sketch Style** - All images are generated in a beautiful pencil sketch style
- **🔐 User Authentication** - Register and login to manage your drawings
- **🗑️ Gallery Management** - Delete unwanted drawings from your gallery

---

## 🛠️ Technology Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.2.0 | UI Framework |
| Vite | 7.2.4 | Build Tool & Dev Server |
| React Router | 7.12.0 | Client-side Routing |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Python | 3.x | Backend Language |
| Flask | 3.0.0 | Web Framework |
| SQLite | - | Database |
| Flask-Login | - | User Authentication |
| Flask-CORS | - | Cross-Origin Resource Sharing |
| Google GenAI | - | AI Image Generation (Primary) |
| Pollinations.AI | - | AI Image Generation (Fallback) |

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed on your system:

### Required Software

1. **Python 3.8 or higher**
   - Download from: https://www.python.org/downloads/
   - Make sure to check "Add Python to PATH" during installation

2. **Node.js 18 or higher**
   - Download from: https://nodejs.org/
   - This includes npm (Node Package Manager)

3. **Git** (optional, for cloning)
   - Download from: https://git-scm.com/

### Verify Installation

Open a terminal/command prompt and run:

```bash
# Check Python version
python --version

# Check Node.js version
node --version

# Check npm version
npm --version
```

---

## 🚀 Installation Guide

### Step 1: Download the Project

**Option A: Clone from Git (if available)**
```bash
git clone <repository-url>
cd GGG
```

**Option B: Download ZIP**
1. Download the project ZIP file
2. Extract it to your desired location
3. Open a terminal in the extracted folder

---

### Step 2: Backend Setup

1. **Navigate to the backend folder**
   ```bash
   cd backend
   ```

2. **Create a virtual environment (recommended)**
   ```bash
   # Windows
   python -m venv venv
   venv\Scripts\activate

   # macOS/Linux
   python3 -m venv venv
   source venv/bin/activate
   ```

3. **Install Python dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Verify installation**
   ```bash
   pip list
   ```
   You should see: Flask, google-genai, Flask-Cors, Flask-Login, requests, Werkzeug

---

### Step 3: Frontend Setup

1. **Open a new terminal and navigate to the frontend folder**
   ```bash
   cd frontend
   ```

2. **Install Node.js dependencies**
   ```bash
   npm install
   ```

3. **Verify installation**
   ```bash
   npm list --depth=0
   ```

---

## ▶️ Running the Application

### Quick Start (Windows Only)

Simply double-click the `start.bat` file in the project root folder. This will:
1. Start the backend server automatically
2. Start the frontend development server
3. Open the application in your browser

---

### Manual Start (All Operating Systems)

You need to run **two separate terminals**:

#### Terminal 1: Start Backend Server

```bash
# Navigate to backend folder
cd backend

# Activate virtual environment (if created)
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Run the Flask server
python app.py
```

You should see:
```
🎨 TalkDraw Backend running on http://localhost:5000
```

#### Terminal 2: Start Frontend Server

```bash
# Navigate to frontend folder
cd frontend

# Start the development server
npm run dev
```

You should see:
```
VITE v7.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
```

---

### Access the Application

Open your web browser and go to:

🌐 **http://localhost:5173/**

---

## 📖 How to Use TalkDraw

### Drawing with Text Input

1. In the text input field, type a description of what you want to draw
   - Example: "a cute cat sitting on a pillow"
   - Example: "mountain landscape with a river"
   - Example: "portrait of a girl with flowers"

2. Click the **"✨ Draw"** button

3. Watch the animated pencil cursor as the AI creates your artwork!

4. The drawing is automatically saved to your gallery

---

### Drawing with Voice Input

1. Click the **🎙️ microphone button** next to the text input

2. Speak your drawing prompt clearly
   - Example: "Draw a beautiful sunset over the ocean"

3. The voice will be transcribed and automatically submitted

4. Watch the magic happen!

---

### Viewing Your Gallery

1. Click **"Gallery"** in the navigation bar

2. Browse all your generated drawings

3. Each drawing shows:
   - The generated image
   - The original prompt
   - Creation date/time

4. Click the **delete button** to remove unwanted drawings

---

### Clearing the Canvas

- Click the **"🗑️ Clear"** button to clear the current canvas and start fresh

---

## 📁 Project Structure

```
GGG/
├── backend/                    # Python Flask Backend
│   ├── app.py                 # Main Flask application
│   ├── models.py              # Database models (User, Drawing)
│   ├── requirements.txt       # Python dependencies
│   ├── talkdraw.db           # SQLite database (auto-created)
│   └── images/               # Generated images storage
│
├── frontend/                   # React Frontend
│   ├── public/               # Static assets
│   ├── src/
│   │   ├── components/       # React components
│   │   │   ├── HomePage.jsx     # Main drawing page
│   │   │   ├── Gallery.jsx      # Gallery page
│   │   │   ├── VoiceInput.jsx   # Voice input component
│   │   │   ├── useDrawingCanvas.jsx  # Canvas animation hook
│   │   │   ├── Login.jsx        # Login page
│   │   │   └── Register.jsx     # Registration page
│   │   ├── App.jsx           # Main app component
│   │   ├── index.css         # Global styles
│   │   └── main.jsx          # Entry point
│   ├── index.html            # HTML template
│   ├── package.json          # Node.js dependencies
│   └── vite.config.js        # Vite configuration
│
├── start.bat                  # Quick start script (Windows)
└── README.md                  # This file
```

---

## 🔧 Configuration

### API Key (Optional)

The application uses **Google Gemini AI** as the primary image generator. The API key is pre-configured, but you can use your own:

1. Get an API key from [Google AI Studio](https://aistudio.google.com/)

2. Open `backend/app.py`

3. Find line 114 and replace the API key:
   ```python
   client = genai.Client(api_key='YOUR_API_KEY_HERE')
   ```

### Changing the Port

**Backend Port (default: 5000)**
- Edit `backend/app.py`, line 250:
  ```python
  app.run(debug=True, port=5000)  # Change 5000 to your desired port
  ```

**Frontend Port (default: 5173)**
- Edit `frontend/vite.config.js`:
  ```javascript
  export default defineConfig({
    plugins: [react()],
    server: {
      port: 3000  // Add this line to change port
    }
  })
  ```

---

## ❗ Troubleshooting

### Common Issues & Solutions

| Problem | Solution |
|---------|----------|
| `python` command not found | Use `python3` instead or reinstall Python with PATH option |
| `npm` command not found | Install Node.js from nodejs.org |
| Backend won't start | Check if port 5000 is already in use |
| Frontend won't start | Check if port 5173 is already in use |
| CORS errors in browser | Make sure backend is running on port 5000 |
| Image generation fails | Check internet connection; AI service requires internet |
| Voice input not working | Allow microphone permissions in your browser |

### Port Already in Use

**Windows:**
```bash
# Find process using port 5000
netstat -ano | findstr :5000

# Kill the process (replace PID with actual number)
taskkill /PID <PID> /F
```

**macOS/Linux:**
```bash
# Find and kill process on port 5000
lsof -i :5000
kill -9 <PID>
```

### Clear Database

If you need to reset the database:
```bash
cd backend
del talkdraw.db   # Windows
rm talkdraw.db    # macOS/Linux
```

---

## 🌐 Browser Compatibility

| Browser | Supported | Voice Input |
|---------|-----------|-------------|
| Chrome | ✅ Yes | ✅ Yes |
| Firefox | ✅ Yes | ✅ Yes |
| Edge | ✅ Yes | ✅ Yes |
| Safari | ✅ Yes | ⚠️ Limited |

> **Note:** Voice input requires a modern browser with Web Speech API support.

---

## 📝 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| POST | `/api/auth/logout` | Logout user |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/generate` | Generate AI image |
| GET | `/api/gallery` | Get all drawings |
| DELETE | `/api/gallery/:id` | Delete a drawing |
| GET | `/api/images/:filename` | Serve generated image |

---

## 🎓 For Students/Beginners

### Understanding the Flow

1. **User enters a prompt** → Frontend captures the text/voice input
2. **Frontend sends request** → POST request to `/api/generate`
3. **Backend processes** → Enhances prompt with "pencil sketch" style
4. **AI generates image** → Gemini AI (or Pollinations.AI fallback)
5. **Image saved** → Stored in `backend/images/` folder
6. **Database updated** → Drawing record added to SQLite
7. **Frontend receives URL** → Starts the drawing animation
8. **Canvas reveal effect** → Pencil cursor animates across canvas
9. **Complete!** → Image fully revealed, saved to gallery

### Key Files to Study

- `backend/app.py` - Main Flask routes and image generation logic
- `backend/models.py` - Database models using SQLite
- `frontend/src/components/useDrawingCanvas.jsx` - Canvas animation logic
- `frontend/src/components/VoiceInput.jsx` - Voice recognition

---

## 📄 License

This project is created for educational purposes.

---

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest new features
- Submit pull requests

---

## 📧 Support

If you encounter any issues or have questions, please:
1. Check the Troubleshooting section above
2. Review the code comments
3. Open an issue in the repository

---

**Happy Drawing! 🎨✨**
