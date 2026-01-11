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

console.log('Script.js loaded!');

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
    
    // Handle Enter key in prompt input
    const promptInput = document.getElementById('promptInput');
    if (promptInput) {
        promptInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                startDrawing();
            }
        });
    }

    console.log('App initialized successfully!');
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
        
        // Clear error message after 5 seconds
        setTimeout(() => {
            if (document.getElementById('transcript').textContent === errorMsg) {
                showTranscript('');
            }
        }, 5000);
    };
}

function toggleVoice() {
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
}

function showTranscript(text) {
    document.getElementById('transcript').textContent = text;
}

// Main Drawing Flow
async function startDrawing() {
    const prompt = document.getElementById('promptInput').value.trim();
    if (!prompt) {
        alert('Please enter a drawing prompt!');
        return;
    }
    
    if (isGenerating) return;
    
    isGenerating = true;
    currentCommand = prompt;
    
    // Hide action buttons
    document.getElementById('actionButtons').style.display = 'none';
    
    // Clear canvas
    clearCanvas();
    
    // Start wandering cursor animation
    startWanderingCursor();
    
    // Show status messages
    await showStatusSequence();
    
    // Generate image with Puter AI
    await generateImage(prompt);
}

function clearCanvas() {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add subtle paper texture
    ctx.fillStyle = '#f8f8f8';
    for (let i = 0; i < 1000; i++) {
        ctx.fillRect(
            Math.random() * canvas.width,
            Math.random() * canvas.height,
            1, 1
        );
    }
}

// Wandering Cursor Animation
function startWanderingCursor() {
    const cursor = document.getElementById('pencilCursor');
    cursor.classList.add('active');
    
    let x = canvas.width / 2;
    let y = canvas.height / 2;
    let vx = (Math.random() - 0.5) * 4;
    let vy = (Math.random() - 0.5) * 4;
    
    function animate() {
        // Update velocity with random changes
        vx += (Math.random() - 0.5) * 0.5;
        vy += (Math.random() - 0.5) * 0.5;
        
        // Limit speed
        const speed = Math.sqrt(vx * vx + vy * vy);
        if (speed > 3) {
            vx = (vx / speed) * 3;
            vy = (vy / speed) * 3;
        }
        
        // Update position
        x += vx;
        y += vy;
        
        // Bounce off edges
        if (x < 50 || x > canvas.width - 50) vx *= -1;
        if (y < 50 || y > canvas.height - 50) vy *= -1;
        
        // Keep in bounds
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

// Status Messages
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

// Image Generation with Free APIs
async function generateImage(prompt) {
    try {
        // Enhance prompt for pencil sketch style
        const enhancedPrompt = `${prompt}, pencil sketch style, hand-drawn lines, simple black and white, clean line art, slight imperfections, on white paper, professional sketch`;
        
        showStatus('Generating your drawing... 🎨');
        
        let imageElement;

        try {
            // Primary Method: Pollinations.ai (No login required)
            console.log('Attempting generation with Pollinations.ai...');
            imageElement = await generateWithPollinations(enhancedPrompt);
        } catch (pollinationsError) {
            console.warn('Pollinations failed, switching to fallback...', pollinationsError);
            showStatus('Switching to fallback provider... 🔄');

            // Fallback Method: Puter.js (May require login/credits or test mode)
            try {
                console.log('Attempting generation with Puter.js...');
                imageElement = await generateWithPuter(enhancedPrompt);
            } catch (puterError) {
                console.error('All providers failed');
                throw new Error('All image generation providers failed.');
            }
        }

        currentImageUrl = imageElement.src;
        
        // Wait a moment then start reveal animation
        await sleep(1000);
        hideStatus();
        
        // Progressive reveal
        await progressiveReveal(imageElement);
        
        // Show completion
        showStatus('Done! ✨');
        await sleep(1000);
        hideStatus();
        
        // Show action buttons
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

// Pollinations.ai - Free, no-login image generation
async function generateWithPollinations(prompt) {
    const encodedPrompt = encodeURIComponent(prompt);
    // Add seed to avoid caching same image for same prompt if retried
    const seed = Math.floor(Math.random() * 1000000);
    const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?nologo=true&seed=${seed}&model=flux`;

    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous'; // Important for canvas manipulation

        img.onload = () => {
            console.log('Pollinations image loaded successfully');
            resolve(img);
        };

        img.onerror = (e) => {
            console.error('Pollinations image load failed', e);
            reject(new Error('Failed to load image from Pollinations'));
        };

        img.src = url;
    });
}

// Puter.js - Free AI image generation with test mode (no auth required)
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
        
        // Use Puter.js txt2img with test_mode to avoid balance issues
        // Test mode returns sample images without consuming credits
        console.log('Calling puter.ai.txt2img with test_mode...');
        const imageElement = await puter.ai.txt2img(prompt, {
            test_mode: true
        });
        
        console.log('Image element received:', imageElement);
        console.log('Image src:', imageElement?.src);
        console.log('=== Image generation successful! ===');
        return imageElement;
    } catch (error) {
        console.error('=== Puter image generation FAILED ===');
        console.error('Error object:', error);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        
        // Fallback: If test mode fails, show helpful error
        if (error.message && error.message.toLowerCase().includes('balance')) {
            alert('⚠️ Low balance detected. The app is using test mode for free images.\nFor production-quality images, users can add credits at puter.com');
        }
        
        throw error;
    }
}

// Progressive Reveal Animation
async function progressiveReveal(imageElement) {
    return new Promise((resolve) => {
        // Create temporary canvas to draw the generated image
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        
        // Draw white background
        tempCtx.fillStyle = '#ffffff';
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        
        // Calculate dimensions to fit image
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
        
        // Draw the generated image on temp canvas
        tempCtx.drawImage(imageElement, drawX, drawY, drawWidth, drawHeight);
        
        // Animate reveal
        const cursor = document.getElementById('pencilCursor');
        const duration = 10000; // 10 seconds
        const startTime = Date.now();
        const revealPaths = generateRevealPaths(drawWidth, drawHeight, drawX, drawY);
        
        function reveal() {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Clear and redraw background
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Draw revealed portion
            ctx.drawImage(tempCanvas, 0, 0);
            
            // Draw white mask over unrevealed areas
            ctx.globalCompositeOperation = 'destination-out';
            
            const revealedPaths = Math.floor(revealPaths.length * progress);
            for (let i = revealedPaths; i < revealPaths.length; i++) {
                const path = revealPaths[i];
                ctx.fillStyle = 'rgba(255,255,255,1)';
                ctx.fillRect(path.x, path.y, path.w, path.h);
            }
            
            ctx.globalCompositeOperation = 'source-over';
            
            // Move cursor along reveal path
            if (revealedPaths > 0) {
                const currentPath = revealPaths[revealedPaths - 1];
                cursor.style.left = (currentPath.x + currentPath.w / 2) + 'px';
                cursor.style.top = (currentPath.y + currentPath.h / 2) + 'px';
            }
            
            if (progress < 1) {
                revealAnimationId = requestAnimationFrame(reveal);
            } else {
                // Reveal complete
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
    
    // Create horizontal strips from top to bottom with slight randomization
    for (let i = 0; i < numStrips; i++) {
        paths.push({
            x: startX,
            y: startY + i * stripHeight,
            w: width,
            h: stripHeight
        });
    }
    
    // Shuffle for more natural reveal
    for (let i = paths.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [paths[i], paths[j]] = [paths[j], paths[i]];
    }
    
    return paths.reverse(); // Reverse so we unmask progressively
}

// Save Drawing
async function saveDrawing() {
    if (!currentImageUrl || !currentCommand) {
        alert('No drawing to save!');
        return;
    }
    
    try {
        // Fetch the blob from the currentImageUrl
        const imgResponse = await fetch(currentImageUrl);
        const blob = await imgResponse.blob();

        const formData = new FormData();
        formData.append('command', currentCommand);
        formData.append('image', blob, 'drawing.png');

        const response = await fetch('/api/save-drawing', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        if (data.success) {
            alert('✨ Drawing saved to your gallery!');
            document.getElementById('actionButtons').style.display = 'none';
        } else {
            alert('Error saving drawing: ' + data.error);
        }
    } catch (error) {
        console.error('Save error:', error);
        alert('Network error while saving');
    }
}

// New Drawing
function newDrawing() {
    currentImageUrl = null;
    currentCommand = null;
    document.getElementById('promptInput').value = '';
    document.getElementById('transcript').textContent = '';
    document.getElementById('actionButtons').style.display = 'none';
    clearCanvas();
}

// Gallery Functions
async function loadGallery() {
    try {
        const response = await fetch('/api/get-drawings');
        const data = await response.json();
        
        const grid = document.getElementById('galleryGrid');
        grid.innerHTML = '';
        
        if (!data.drawings || data.drawings.length === 0) {
            grid.innerHTML = '<div class="gallery-empty">No drawings yet! Start creating 🎨</div>';
            return;
        }
        
        data.drawings.forEach(drawing => {
            const item = document.createElement('div');
            item.className = 'gallery-item';
            
            const img = document.createElement('img');
            img.src = drawing.image_url;
            img.alt = drawing.command;
            img.onclick = () => showModal(drawing);
            
            const info = document.createElement('div');
            info.className = 'gallery-info';
            
            const command = document.createElement('div');
            command.className = 'gallery-command';
            command.textContent = drawing.command;
            
            const date = document.createElement('div');
            date.className = 'gallery-date';
            date.textContent = new Date(drawing.created_at).toLocaleDateString();
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn';
            deleteBtn.textContent = '🗑️ Delete';
            deleteBtn.onclick = (e) => {
                e.stopPropagation();
                deleteDrawing(drawing.id);
            };
            
            info.appendChild(command);
            info.appendChild(date);
            info.appendChild(deleteBtn);
            
            item.appendChild(img);
            item.appendChild(info);
            grid.appendChild(item);
        });
    } catch (error) {
        console.error('Load gallery error:', error);
    }
}

async function deleteDrawing(id) {
    if (!confirm('Delete this drawing?')) return;
    
    try {
        const response = await fetch(`/api/delete-drawing/${id}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        if (data.success) {
            loadGallery();
        }
    } catch (error) {
        console.error('Delete error:', error);
    }
}

function showModal(drawing) {
    const modal = document.getElementById('imageModal');
    const img = document.getElementById('modalImage');
    const command = document.getElementById('modalCommand');
    const date = document.getElementById('modalDate');
    
    img.src = drawing.image_url;
    command.textContent = drawing.command;
    date.textContent = 'Created: ' + new Date(drawing.created_at).toLocaleString();
    
    modal.classList.add('active');
}

function closeModal() {
    document.getElementById('imageModal').classList.remove('active');
}

// Tab Switching
function switchTab(tab) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    
    if (tab === 'draw') {
        document.getElementById('drawTab').classList.add('active');
    } else if (tab === 'gallery') {
        document.getElementById('galleryTab').classList.add('active');
        loadGallery();
    }
}

// Utility
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
