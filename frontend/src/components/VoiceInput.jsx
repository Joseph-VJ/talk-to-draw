import { useState, useEffect, useRef } from 'react';

export default function VoiceInput({ onTranscript, disabled }) {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [isSupported, setIsSupported] = useState(true);
    const recognitionRef = useRef(null);

    useEffect(() => {
        // Check for Speech Recognition support
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            setIsSupported(false);
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
            setIsListening(true);
            setTranscript('');
        };

        recognition.onresult = (event) => {
            let finalTranscript = '';
            let interimTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const result = event.results[i];
                if (result.isFinal) {
                    finalTranscript += result[0].transcript;
                } else {
                    interimTranscript += result[0].transcript;
                }
            }

            const currentTranscript = finalTranscript || interimTranscript;
            setTranscript(currentTranscript);

            // If we have a final result, send it
            if (finalTranscript && onTranscript) {
                onTranscript(finalTranscript);
            }
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            setIsListening(false);
            if (event.error === 'not-allowed') {
                setTranscript('Microphone access denied. Please allow microphone access.');
            }
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognitionRef.current = recognition;

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.abort();
            }
        };
    }, [onTranscript]);

    const toggleListening = () => {
        if (!recognitionRef.current) return;

        if (isListening) {
            recognitionRef.current.stop();
        } else {
            setTranscript('');
            try {
                recognitionRef.current.start();
            } catch (error) {
                console.error('Failed to start recognition:', error);
            }
        }
    };

    if (!isSupported) {
        return (
            <button
                className="btn btn-icon mic-button"
                disabled
                title="Voice input not supported in this browser"
            >
                🎤
            </button>
        );
    }

    return (
        <>
            <button
                className={`btn btn-icon mic-button ${isListening ? 'recording' : ''}`}
                onClick={toggleListening}
                disabled={disabled}
                title={isListening ? 'Stop listening' : 'Start voice input'}
            >
                {isListening ? '⏹️' : '🎤'}
            </button>
            {transcript && (
                <div className="transcript">
                    "{transcript}"
                </div>
            )}
        </>
    );
}
