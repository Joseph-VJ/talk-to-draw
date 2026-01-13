import { useState, useRef, useEffect, useCallback } from 'react';

const API_URL = 'http://localhost:5000';

// Status messages to display during generation
const STATUS_MESSAGES = [
  { text: 'Thinking...', minTime: 0 },
  { text: 'Planning the composition...', minTime: 1500 },
  { text: 'Sketching the outline...', minTime: 3000 },
  { text: 'Adding details...', minTime: 5000 },
  { text: 'Refining strokes...', minTime: 7000 },
  { text: 'Almost done!', minTime: 9000 },
];

export default function DrawingCanvas({ onComplete }) {
  const canvasRef = useRef(null);
  const overlayRef = useRef(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRevealing, setIsRevealing] = useState(false);
  const [status, setStatus] = useState('Ready to draw');
  const [pencilPos, setPencilPos] = useState({ x: 384, y: 384 });
  const [showPencil, setShowPencil] = useState(false);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [currentPrompt, setCurrentPrompt] = useState('');
  const animationRef = useRef(null);
  const statusInterval = useRef(null);
  const revealProgress = useRef(0);

  // Debug log to confirm new version loaded
  useEffect(() => {
    console.log("DrawingCanvas Hooks Loaded - v2.0 Clean");
  }, []);

  // Smooth wandering cursor animation (Bezier-like movement)
  const animateWanderingCursor = useCallback(() => {
    let targetX = 384;
    let targetY = 384;
    let currentX = 384;
    let currentY = 384;
    let pauseCounter = 0;

    const animate = () => {
      // Occasionally pick a new target
      if (Math.random() < 0.02 || pauseCounter > 60) {
        targetX = 100 + Math.random() * 568;
        targetY = 100 + Math.random() * 568;
        pauseCounter = 0;
      }

      // Smooth easing towards target
      currentX += (targetX - currentX) * 0.03;
      currentY += (targetY - currentY) * 0.03;

      // Add slight wobble for natural feel
      const wobbleX = Math.sin(Date.now() / 200) * 2;
      const wobbleY = Math.cos(Date.now() / 250) * 2;

      setPencilPos({
        x: currentX + wobbleX,
        y: currentY + wobbleY
      });

      pauseCounter++;
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();
  }, []);

  // Progressive reveal animation
  const animateReveal = useCallback((imageUrl) => {
    const canvas = overlayRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Fill overlay with white initially
    ctx.fillStyle = '#fefefe';
    ctx.fillRect(0, 0, width, height);

    revealProgress.current = 0;
    const totalDuration = 5000; // 5 seconds reveal
    const startTime = Date.now();

    // Create multiple reveal centers for organic look
    const revealCenters = [];
    for (let i = 0; i < 8; i++) {
      revealCenters.push({
        x: 100 + Math.random() * (width - 200),
        y: 100 + Math.random() * (height - 200),
        delay: Math.random() * 0.4,
        speed: 0.8 + Math.random() * 0.4
      });
    }

    const reveal = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / totalDuration, 1);
      revealProgress.current = progress;

      // Clear the overlay canvas
      ctx.fillStyle = '#fefefe';
      ctx.fillRect(0, 0, width, height);

      // Use composite operation to "cut out" revealed areas
      ctx.globalCompositeOperation = 'destination-out';

      // Reveal from multiple growing circles
      revealCenters.forEach((center, i) => {
        const adjustedProgress = Math.max(0, (progress - center.delay) / (1 - center.delay));
        if (adjustedProgress > 0) {
          const maxRadius = Math.max(width, height) * 0.6;
          const radius = adjustedProgress * maxRadius * center.speed;

          // Create gradient for soft edges
          const gradient = ctx.createRadialGradient(
            center.x, center.y, 0,
            center.x, center.y, radius
          );
          gradient.addColorStop(0, 'rgba(0,0,0,1)');
          gradient.addColorStop(0.7, 'rgba(0,0,0,0.8)');
          gradient.addColorStop(1, 'rgba(0,0,0,0)');

          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // Add sweeping reveal from center
      const sweepRadius = progress * Math.max(width, height);
      const centerGradient = ctx.createRadialGradient(
        width / 2, height / 2, 0,
        width / 2, height / 2, sweepRadius
      );
      centerGradient.addColorStop(0, 'rgba(0,0,0,1)');
      centerGradient.addColorStop(0.8, 'rgba(0,0,0,0.5)');
      centerGradient.addColorStop(1, 'rgba(0,0,0,0)');

      ctx.fillStyle = centerGradient;
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, sweepRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalCompositeOperation = 'source-over';

      // Move pencil along reveal path
      const activeCenter = revealCenters[Math.floor(progress * revealCenters.length) % revealCenters.length];
      const angle = progress * Math.PI * 6;
      const pencilRadius = 50 + progress * 200;
      setPencilPos({
        x: activeCenter.x + Math.cos(angle) * pencilRadius * (1 - progress * 0.5),
        y: activeCenter.y + Math.sin(angle) * pencilRadius * (1 - progress * 0.5)
      });

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(reveal);
      } else {
        // Fully reveal - clear overlay
        ctx.clearRect(0, 0, width, height);
        setShowPencil(false);
        setIsRevealing(false);
        setStatus('Drawing complete! ✨');
        if (onComplete) {
          onComplete(imageUrl, currentPrompt);
        }
      }
    };

    reveal();
  }, [currentPrompt, onComplete]);

  // Generate image from prompt
  const generateImage = async (prompt) => {
    if (!prompt.trim() || isGenerating) return;

    // Clear previous image first
    const canvas = canvasRef.current;
    const overlay = overlayRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#fefefe';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    if (overlay) {
      const ctx = overlay.getContext('2d');
      ctx.clearRect(0, 0, overlay.width, overlay.height);
    }

    setCurrentPrompt(prompt);
    setIsGenerating(true);
    setShowPencil(true);
    setGeneratedImage(null);
    setStatus(STATUS_MESSAGES[0].text);

    // Start wandering cursor
    animateWanderingCursor();

    // Cycle through status messages
    let messageIndex = 0;
    statusInterval.current = setInterval(() => {
      messageIndex = Math.min(messageIndex + 1, STATUS_MESSAGES.length - 1);
      setStatus(STATUS_MESSAGES[messageIndex].text);
    }, 2000);

    try {
      console.log("Fetching from API...");
      const response = await fetch(`${API_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ prompt })
      });

      const data = await response.json();

      if (data.success) {
        const imageUrl = `${API_URL}${data.image_url}`;

        // Preload image
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          // Stop wandering, start reveal
          cancelAnimationFrame(animationRef.current);
          clearInterval(statusInterval.current);

          setGeneratedImage(imageUrl);
          setIsGenerating(false);
          setIsRevealing(true);
          setStatus('Drawing your masterpiece...');

          // Draw image on main canvas
          const canvas = canvasRef.current;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          // Start reveal animation
          animateReveal(imageUrl);
        };
        img.src = imageUrl;
      } else {
        throw new Error(data.error || 'Generation failed');
      }
    } catch (error) {
      console.error('Generation error:', error);
      cancelAnimationFrame(animationRef.current);
      clearInterval(statusInterval.current);
      setIsGenerating(false);
      setShowPencil(false);
      setStatus(`Error: ${error.message}`);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (statusInterval.current) clearInterval(statusInterval.current);
    };
  }, []);

  // Clear canvas
  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const overlay = overlayRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#fefefe';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    if (overlay) {
      const ctx = overlay.getContext('2d');
      ctx.clearRect(0, 0, overlay.width, overlay.height);
    }
    setGeneratedImage(null);
    setStatus('Ready to draw');
  };

  return {
    canvasRef,
    overlayRef,
    isGenerating,
    isRevealing,
    status,
    pencilPos,
    showPencil,
    generatedImage,
    currentPrompt,
    generateImage,
    clearCanvas,
    isBusy: isGenerating || isRevealing
  };
}
