// Import Puter.js SDK
import puter from 'puter';

// Import styles
import './style.css';

// Make puter globally available for the rest of the application
window.puter = puter;

console.log('✅ Puter.js loaded successfully!', puter);
console.log('✅ Main.js executing - CSS should be loaded');

// Global state
let canvas, ctx;
let currentImageUrl = null;
let currentCommand = null;
let isGenerating = false;
let recognition = null;
let isListening = false;

// Animation states
let cursorAnimationId = null;
let revealAnimationId = null;

console.log('App loaded!');

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing app...');
    
    canvas = document.getElementById('drawingCanvas');
    if (!canvas) {
        console.error('Canvas element not found!');
        return;
    }

    console.log('Canvas found, setting up...');
    ctx = canvas.getContext('2d');
    
    // Set canvas size
    const container = canvas.parentElement;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    
    console.log('Canvas size:', canvas.width, 'x', canvas.height);
    
    // Initialize speech recognition
    initSpeechRecognition();
    
    // Load gallery on startup
    loadGallery();
    
    console.log('App initialized successfully!');
    
    // Handle Enter key in prompt input
    const promptInput = document.getElementById('promptInput');
    if (promptInput) {
        promptInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                window.startDrawing();
            }
        });
    }
});

// Speech Recognition Setup
function initSpeechRecognition() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        console.log('Speech recognition not supported');
        return;
    }
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    
    recognition.onstart = () => {
        isListening = true;
        document.getElementById('micBtn').classList.add('recording');
        document.getElementById('micIcon').textContent = '🔴';
        showTranscript('Listening...');
    };
    
    recognition.onresult = (event) => {
        let transcript = '';
        for (let i = 0; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
        }
        showTranscript(transcript);
        if (event.results[0].isFinal) {
            document.getElementById('promptInput').value = transcript;
        }
    };
    
    recognition.onend = () => {
        isListening = false;
        document.getElementById('micBtn').classList.remove('recording');
        document.getElementById('micIcon').textContent = '🎤';
    };
    
    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        isListening = false;
        document.getElementById('micBtn').classList.remove('recording');
        document.getElementById('micIcon').textContent = '🎤';
        
        let errorMsg = '';
        switch(event.error) {
            case 'no-speech':
                errorMsg = '🎤 No speech detected. Click mic and speak clearly!';
                break;
            case 'audio-capture':
                errorMsg = '🎤 No microphone found. Check your device settings.';
                break;
            case 'not-allowed':
                errorMsg = '🎤 Microphone permission denied. Please allow microphone access.';
                break;
            case 'network':
                errorMsg = '🎤 Network error. Check your internet connection.';
                break;
            default:
                errorMsg = '🎤 Error: ' + event.error + '. Try typing instead!';
        }
        showTranscript(errorMsg);
        
        setTimeout(() => {
            if (document.getElementById('transcript').textContent === errorMsg) {
                showTranscript('');
            }
        }, 5000);
    };
}

window.toggleVoice = function() {
    if (!recognition) {
        showTranscript('🎤 Voice input requires Chrome or Edge browser. Use text input instead!');
        setTimeout(() => showTranscript(''), 5000);
        return;
    }
    
    if (isListening) {
        recognition.stop();
    } else {
        try {
            recognition.start();
            showTranscript('🎤 Listening... Speak now!');
        } catch (error) {
            console.error('Recognition start error:', error);
            showTranscript('🎤 Error starting microphone. Try again!');
            setTimeout(() => showTranscript(''), 3000);
        }
    }
};

function showTranscript(text) {
    document.getElementById('transcript').textContent = text;
}

// Main Drawing Flow
window.startDrawing = async function() {
    const prompt = document.getElementById('promptInput').value.trim();
    if (!prompt) {
        alert('Please enter a drawing prompt!');
        return;
    }
    
    if (isGenerating) return;
    
    isGenerating = true;
    currentCommand = prompt;
    
    document.getElementById('actionButtons').style.display = 'none';
    clearCanvas();
    startWanderingCursor();
    await showStatusSequence();
    await generateImage(prompt);
};

function clearCanvas() {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#f8f8f8';
    for (let i = 0; i < 1000; i++) {
        ctx.fillRect(
            Math.random() * canvas.width,
            Math.random() * canvas.height,
            1, 1
        );
    }
}

function startWanderingCursor() {
    const cursor = document.getElementById('pencilCursor');
    cursor.classList.add('active');
    
    let x = canvas.width / 2;
    let y = canvas.height / 2;
    let vx = (Math.random() - 0.5) * 4;
    let vy = (Math.random() - 0.5) * 4;
    
    function animate() {
        vx += (Math.random() - 0.5) * 0.5;
        vy += (Math.random() - 0.5) * 0.5;
        
        const speed = Math.sqrt(vx * vx + vy * vy);
        if (speed > 3) {
            vx = (vx / speed) * 3;
            vy = (vy / speed) * 3;
        }
        
        x += vx;
        y += vy;
        
        if (x < 50 || x > canvas.width - 50) vx *= -1;
        if (y < 50 || y > canvas.height - 50) vy *= -1;
        
        x = Math.max(50, Math.min(canvas.width - 50, x));
        y = Math.max(50, Math.min(canvas.height - 50, y));
        
        cursor.style.left = x + 'px';
        cursor.style.top = y + 'px';
        
        cursorAnimationId = requestAnimationFrame(animate);
    }
    
    animate();
}

function stopWanderingCursor() {
    if (cursorAnimationId) {
        cancelAnimationFrame(cursorAnimationId);
        cursorAnimationId = null;
    }
}

async function showStatusSequence() {
    const messages = [
        'Thinking... 🤔',
        'Sketching outline... ✏️',
        'Adding details... ✨',
        'Almost there... 🎨'
    ];
    
    const statusEl = document.getElementById('statusText');
    
    for (const msg of messages) {
        statusEl.textContent = msg;
        statusEl.classList.add('active');
        await sleep(2000);
    }
}

function hideStatus() {
    const statusEl = document.getElementById('statusText');
    statusEl.classList.remove('active');
}

async function generateImage(prompt) {
    try {
        const enhancedPrompt = `${prompt}, pencil sketch style, hand-drawn lines, simple black and white, clean line art, slight imperfections, on white paper, professional sketch`;
        
        showStatus('Generating your drawing... 🎨');
        
        const imageElement = await generateWithPuter(enhancedPrompt);
        currentImageUrl = imageElement.src;
        
        await sleep(1000);
        hideStatus();
        
        await progressiveReveal(imageElement);
        
        showStatus('Done! ✨');
        await sleep(1000);
        hideStatus();
        
        document.getElementById('actionButtons').style.display = 'flex';
        
        isGenerating = false;
        
    } catch (error) {
        console.error('Generation error:', error);
        showStatus('Error generating image. Please try again.');
        stopWanderingCursor();
        document.getElementById('pencilCursor').classList.remove('active');
        isGenerating = false;
    }
}

function showStatus(msg) {
    const statusEl = document.getElementById('statusText');
    statusEl.textContent = msg;
    statusEl.classList.add('active');
}

/**
 * Generate image using Puter.js - Free, unlimited AI image generation
 * 
 * Puter.js Benefits:
 * - No API key required (handles authentication internally)
 * - 100% serverless - runs entirely in the browser
 * - Multiple high-quality models (FLUX.1, SDXL, etc.)
 * - Returns Blob for easy Canvas integration
 * - Free and unlimited usage
 * 
 * @param {string} prompt - The text description of the image to generate
 * @returns {Promise<HTMLImageElement>} Image element ready for canvas drawing
 */
async function generateWithPuter(prompt) {
    try {
        console.log('=== Starting Puter.js image generation ===');
        console.log('Prompt:', prompt);
        console.log('Puter available:', typeof puter);
        
        if (typeof puter === 'undefined') {
            console.error('Puter is not defined!');
            throw new Error('Puter.js not loaded. Please refresh the page.');
        }
        
        console.log('Puter.ai available:', typeof puter.ai);
        console.log('Puter.ai.txt2img available:', typeof puter.ai?.txt2img);
        
        showStatus('Generating with AI... 🎨');
        
        // Use Puter.js txt2img with binary mode to get Blob
        console.log('Calling puter.ai.txt2img with binary mode...');
        const imageBlob = await puter.ai.txt2img(prompt, {
            model: 'flux',  // Using FLUX.1 model (high quality)
            binary: true    // Returns a Blob instead of an HTMLImageElement
        });
        
        console.log('Image blob received:', imageBlob);
        console.log('Blob size:', imageBlob?.size, 'type:', imageBlob?.type);
        
        if (!imageBlob || imageBlob.size === 0) {
            throw new Error('Received empty image data');
        }
        
        showStatus('Loading image...');
        
        // Create object URL from blob
        const imageUrl = URL.createObjectURL(imageBlob);
        console.log('Image URL created:', imageUrl);
        
        // Create image element for canvas drawing
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        await new Promise((resolve, reject) => {
            img.onload = () => {
                console.log('Image loaded successfully, dimensions:', img.width, 'x', img.height);
                resolve();
            };
            img.onerror = (e) => {
                console.error('Image load error:', e);
                reject(new Error('Failed to load image'));
            };
            img.src = imageUrl;
        });
        
        console.log('=== Image generation successful! ===');
        return img;
    } catch (error) {
        console.error('=== Image generation FAILED ===');
        console.error('Error object:', error);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        
        // Show user-friendly error
        if (error.message.includes('503')) {
            throw new Error('AI model is loading, please wait 20 seconds and try again');
        } else if (error.message.includes('429')) {
            throw new Error('Too many requests, please wait a moment and try again');
        } else {
            throw new Error('Image generation failed: ' + error.message);
        }
    }
}

async function progressiveReveal(imageElement) {
    return new Promise((resolve) => {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        
        tempCtx.fillStyle = '#ffffff';
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        
        const imgAspect = imageElement.width / imageElement.height;
        const canvasAspect = canvas.width / canvas.height;
        let drawWidth, drawHeight, drawX, drawY;
        
        if (imgAspect > canvasAspect) {
            drawWidth = canvas.width * 0.9;
            drawHeight = drawWidth / imgAspect;
        } else {
            drawHeight = canvas.height * 0.9;
            drawWidth = drawHeight * imgAspect;
        }
        
        drawX = (canvas.width - drawWidth) / 2;
        drawY = (canvas.height - drawHeight) / 2;
        
        tempCtx.drawImage(imageElement, drawX, drawY, drawWidth, drawHeight);
        
        const cursor = document.getElementById('pencilCursor');
        const duration = 10000;
        const startTime = Date.now();
        const revealPaths = generateRevealPaths(drawWidth, drawHeight, drawX, drawY);
        
        function reveal() {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.drawImage(tempCanvas, 0, 0);
            
            ctx.globalCompositeOperation = 'destination-out';
            
            const revealedPaths = Math.floor(revealPaths.length * progress);
            for (let i = revealedPaths; i < revealPaths.length; i++) {
                const path = revealPaths[i];
                ctx.fillStyle = 'rgba(255,255,255,1)';
                ctx.fillRect(path.x, path.y, path.w, path.h);
            }
            
            ctx.globalCompositeOperation = 'source-over';
            
            if (revealedPaths > 0) {
                const currentPath = revealPaths[revealedPaths - 1];
                cursor.style.left = (currentPath.x + currentPath.w / 2) + 'px';
                cursor.style.top = (currentPath.y + currentPath.h / 2) + 'px';
            }
            
            if (progress < 1) {
                revealAnimationId = requestAnimationFrame(reveal);
            } else {
                stopWanderingCursor();
                cursor.classList.remove('active');
                ctx.drawImage(tempCanvas, 0, 0);
                resolve();
            }
        }
        
        stopWanderingCursor();
        reveal();
    });
}

function generateRevealPaths(width, height, startX, startY) {
    const paths = [];
    const stripHeight = 20;
    const numStrips = Math.ceil(height / stripHeight);
    
    for (let i = 0; i < numStrips; i++) {
        paths.push({
            x: startX,
            y: startY + i * stripHeight,
            w: width,
            h: stripHeight
        });
    }
    
    for (let i = paths.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [paths[i], paths[j]] = [paths[j], paths[i]];
    }
    
    return paths.reverse();
}

window.saveDrawing = async function() {
    if (!currentImageUrl || !currentCommand) {
        alert('No drawing to save!');
        return;
    }
    
    try {
        // Convert the blob URL back to a blob for backend upload
        const response = await fetch(currentImageUrl);
        const imageBlob = await response.blob();
        
        // Create FormData to send the image to Python backend
        const formData = new FormData();
        formData.append('image', imageBlob, 'generated_ai.png');
        formData.append('command', currentCommand);
        
        // Send to your Python backend (Flask/FastAPI)
        const saveResponse = await fetch('/api/save-drawing', {
            method: 'POST',
            body: formData
        });
        
        const data = await saveResponse.json();
        if (data.success) {
            alert('✨ Drawing saved to your gallery!');
            document.getElementById('actionButtons').style.display = 'none';
        } else {
            alert('Error saving: ' + data.error);
        }
    } catch (error) {
        console.error('Save error:', error);
        // Fallback if backend is not available
        alert('💾 Backend not connected. Right-click the image to save manually!');
    }
};

window.newDrawing = function() {
    currentImageUrl = null;
    currentCommand = null;
    document.getElementById('promptInput').value = '';
    document.getElementById('transcript').textContent = '';
    document.getElementById('actionButtons').style.display = 'none';
    clearCanvas();
};

async function loadGallery() {
    const grid = document.getElementById('galleryGrid');
    grid.innerHTML = '<div class="gallery-empty">Gallery feature requires a backend. Images are generated live! 🎨</div>';
}

window.switchTab = function(tab) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    
    if (tab === 'draw') {
        document.getElementById('drawTab').classList.add('active');
    } else if (tab === 'gallery') {
        document.getElementById('galleryTab').classList.add('active');
        loadGallery();
    }
};

window.closeModal = function() {
    document.getElementById('imageModal').classList.remove('active');
};

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
