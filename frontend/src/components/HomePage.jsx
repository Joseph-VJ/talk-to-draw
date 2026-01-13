import { useState, useRef } from 'react';
import useDrawingCanvas from './useDrawingCanvas';
import VoiceInput from './VoiceInput';

export default function HomePage() {
    const [prompt, setPrompt] = useState('');
    const promptInputRef = useRef(null);

    const handleComplete = () => {
        // Images are auto-saved to gallery now
    };

    const {
        canvasRef,
        overlayRef,
        isGenerating,
        isRevealing,
        status,
        pencilPos,
        showPencil,
        generateImage,
        clearCanvas,
        isBusy
    } = useDrawingCanvas({ onComplete: handleComplete });

    const handleSubmit = (e) => {
        e?.preventDefault();
        if (prompt.trim() && !isBusy) {
            generateImage(prompt);
            setPrompt('');
        }
    };

    const handleVoiceTranscript = (text) => {
        setPrompt(text);
        setTimeout(() => {
            if (text.trim() && !isBusy) {
                generateImage(text);
                setPrompt('');
            }
        }, 500);
    };

    return (
        <div className="container canvas-section fade-in">
            {/* Canvas Area */}
            <div className="canvas-wrapper">
                <canvas
                    ref={canvasRef}
                    width={768}
                    height={768}
                    className="drawing-canvas"
                />
                <canvas
                    ref={overlayRef}
                    width={768}
                    height={768}
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        pointerEvents: 'none'
                    }}
                />
                {showPencil && (
                    <div
                        className="pencil-cursor"
                        style={{
                            left: `${(pencilPos.x / 768) * 100}%`,
                            top: `${(pencilPos.y / 768) * 100}%`
                        }}
                    >
                        ✏️
                    </div>
                )}
            </div>

            {/* Status Display */}
            <div className="status-display">
                {(isGenerating || isRevealing) && <div className="status-dot"></div>}
                <span>{status}</span>
            </div>

            {/* Prompt Input */}
            <form onSubmit={handleSubmit} className="prompt-section">
                <input
                    ref={promptInputRef}
                    type="text"
                    className="input prompt-input"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe what to draw..."
                    disabled={isBusy}
                />
                <VoiceInput
                    onTranscript={handleVoiceTranscript}
                    disabled={isBusy}
                />
                <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isBusy || !prompt.trim()}
                >
                    {isBusy ? <span className="spinner"></span> : '✨ Draw'}
                </button>
            </form>

            {/* Clear Button */}
            <div className="save-section">
                <button
                    className="btn btn-secondary"
                    onClick={clearCanvas}
                    disabled={isBusy}
                >
                    🗑️ Clear
                </button>
            </div>
        </div>
    );
}
