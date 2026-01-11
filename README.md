# AI Drawing Magic ✨

A magical single-page web app where users can speak or type commands like "draw a cute fox" or "sketch a starry night", and watch as it appears to be drawn live on the canvas with realistic pencil animations!

## Features

🎨 **Live Drawing Illusion**
- Animated pencil cursor that moves naturally while "drawing"
- Progressive reveal animation that makes AI-generated images appear hand-drawn
- Real-time status updates ("Thinking...", "Sketching...", "Adding details...")

🎤 **Voice & Text Input**
- Browser-based speech recognition (works in Chrome/Edge)
- Live transcript display
- Simple text input as alternative

🤖 **Free AI Image Generation**
- Powered by Puter.com's free API (no keys needed!)
- Automatically enhances prompts for pencil sketch style
- Client-side generation - no backend API calls

👤 **User Authentication**
- Simple registration and login
- Session-based authentication
- Personal gallery for each user

🖼️ **Gallery System**
- Save your favorite drawings
- View all past creations
- Delete unwanted drawings
- Grid layout with thumbnails

## Tech Stack

- **Backend**: Python Flask
- **Database**: SQLite (single file, no setup needed)
- **Frontend**: HTML + CSS + Vanilla JavaScript
- **AI Generation**: Puter.com API (client-side)
- **Speech Recognition**: Browser Web Speech API

## Installation & Setup

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Run the App

```bash
python app.py
```

### 3. Open in Browser

Navigate to `http://localhost:5000`

## Project Structure

```
ai-drawing-app/
├── app.py                  # Flask backend with auth & API endpoints
├── database.db            # SQLite database (auto-created)
├── requirements.txt       # Python dependencies
├── templates/
│   └── index.html        # Main HTML template
├── static/
│   ├── css/
│   │   └── style.css     # All styling
│   ├── js/
│   │   └── script.js     # Canvas animations, Puter API, voice recognition
│   └── drawings/         # Saved drawing images (auto-created)
```

## How It Works

### The Magic Flow

1. **User Input**: Type or speak a drawing prompt
2. **Canvas Prep**: Canvas clears, shows blank paper texture
3. **Wandering Cursor**: Animated pencil cursor starts moving naturally
4. **Status Updates**: Shows "Thinking...", "Sketching...", etc.
5. **AI Generation**: Puter API generates pencil sketch (5-15 seconds)
6. **Progressive Reveal**: Image appears to be drawn stroke-by-stroke over 10 seconds
7. **Completion**: Cursor fades, "Done!" message, Save/New buttons appear

### Prompt Enhancement

All user prompts are automatically enhanced:
```
User: "cute fox"
Enhanced: "cute fox, pencil sketch style, hand-drawn lines, simple black and white, 
           clean line art, slight imperfections, on white paper, professional sketch"
```

### Progressive Reveal Animation

The reveal animation:
- Divides the generated image into horizontal strips
- Randomizes the strip order
- Progressively unmasks strips to reveal the drawing
- Moves the pencil cursor to follow the reveal path
- Takes 10 seconds for realistic "hand-drawing" feel

## Browser Compatibility

- **Best Experience**: Chrome, Edge (full voice support)
- **Works Without Voice**: Firefox, Safari (text input only)
- **Mobile**: Works on mobile browsers (touch-friendly UI)

## Tips for Best Results

✅ **Good Prompts:**
- "a cute fox"
- "mountain landscape"
- "vintage car"
- "coffee cup"
- "smiling face"

❌ **Avoid:**
- Very complex scenes (AI may struggle)
- Multiple subjects in one prompt
- Highly detailed requests

## Features in Detail

### Voice Recognition
- Click the 🎤 microphone button to start
- Button turns red 🔴 when listening
- Live transcript appears below input
- Automatically fills input box when done
- Click again to stop early

### Gallery
- All saved drawings appear in grid layout
- Click any image to view full-size
- Shows command and creation date
- Delete button on each item
- Refreshes automatically after save/delete

### Authentication
- Simple username + password
- Passwords are hashed (secure storage)
- Session-based (stays logged in)
- Each user has separate gallery

## Troubleshooting

### Voice not working?
- Use Chrome or Edge browser
- Grant microphone permissions
- Check browser console for errors
- Use text input as alternative

### Images not generating?
- Check internet connection
- Puter API needs network access
- Try simpler prompts
- Wait up to 30 seconds for generation

### Database errors?
- Delete `database.db` to reset
- Restart the Flask app
- Check write permissions in folder

## Advanced Customization

### Adjust Animation Speed

In `script.js`, modify:
```javascript
const duration = 10000; // Reveal duration (ms)
```

### Change Canvas Size

In `style.css`, modify:
```css
.canvas-container {
    width: 800px;
    height: 600px;
}
```

### Customize Prompt Enhancement

In `script.js`, modify the `generateImage` function:
```javascript
const enhancedPrompt = `${prompt}, YOUR CUSTOM STYLE HERE`;
```

## License

Free to use for educational and personal projects!

## Credits

- **AI Generation**: [Puter.com](https://puter.com)
- **UI Inspiration**: Modern web design trends
- **Built with**: Flask, SQLite, Vanilla JS, Love ❤️

---

**Enjoy creating magical AI art! ✨🎨**
