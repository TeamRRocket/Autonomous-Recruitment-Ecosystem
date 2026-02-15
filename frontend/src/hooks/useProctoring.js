import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const WS_BASE_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3000';

/**
 * Custom hook for proctoring functionality
 * Handles webcam access, frame capture, WebSocket communication, and browser event detection
 */
export const useProctoring = (sessionId, isActive = false) => {
    const [isProctoring, setIsProctoring] = useState(false);
    const [hasWebcamPermission, setHasWebcamPermission] = useState(false);
    const [error, setError] = useState(null);

    const streamRef = useRef(null);
    const wsRef = useRef(null);
    const videoRef = useRef(null);
    const captureIntervalRef = useRef(null);

    /**
     * Request webcam permission and start video stream
     */
    const requestWebcamPermission = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facingMode: 'user'
                },
                audio: false
            });

            streamRef.current = stream;
            setHasWebcamPermission(true);
            setError(null);

            // Create hidden video element for frame capture
            if (!videoRef.current) {
                videoRef.current = document.createElement('video');
                videoRef.current.srcObject = stream;
                videoRef.current.play();
            }

            return true;
        } catch (err) {
            console.error('Webcam permission denied:', err);
            setError('Webcam access denied. Please enable camera permissions to continue.');
            setHasWebcamPermission(false);
            return false;
        }
    }, []);

    /**
     * Initialize WebSocket connection for frame streaming
     */
    const initializeWebSocket = useCallback(() => {
        if (!sessionId) {
            console.error('Cannot initialize WebSocket: sessionId is required');
            return;
        }

        try {
            const ws = new WebSocket(`${WS_BASE_URL}/proctoring/ws`);

            ws.onopen = () => {
                console.log('✓ Proctoring WebSocket connected');
                // Send initialization message
                ws.send(JSON.stringify({
                    type: 'INIT',
                    sessionId: sessionId
                }));
            };

            ws.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    if (message.type === 'ERROR') {
                        console.error('WebSocket error:', message.message);
                    }
                } catch (err) {
                    console.error('Failed to parse WebSocket message:', err);
                }
            };

            ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                setError('Proctoring connection failed. Exam will continue but may not be monitored.');
            };

            ws.onclose = () => {
                console.log('WebSocket connection closed');
            };

            wsRef.current = ws;
        } catch (err) {
            console.error('Failed to create WebSocket:', err);
            setError('Failed to establish proctoring connection.');
        }
    }, [sessionId]);

    /**
     * Capture frame from video stream and send via WebSocket
     */
    const captureFrame = useCallback(() => {
        if (!videoRef.current || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
            return;
        }

        try {
            const canvas = document.createElement('canvas');
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;

            const ctx = canvas.getContext('2d');
            ctx.drawImage(videoRef.current, 0, 0);

            // Convert to base64
            const frameData = canvas.toDataURL('image/jpeg', 0.7);

            // Send via WebSocket
            wsRef.current.send(JSON.stringify({
                type: 'FRAME',
                frameData: frameData
            }));
        } catch (err) {
            console.error('Frame capture error:', err);
        }
    }, []);

    /**
     * Send browser event to backend via HTTP
     */
    const sendBrowserEvent = useCallback(async (eventType, metadata = {}) => {
        if (!sessionId) return;

        try {
            await axios.post(
                `${API_BASE_URL}/api/proctoring/event`,
                {
                    sessionId,
                    eventType,
                    metadata
                },
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );
        } catch (err) {
            console.error('Failed to send browser event:', err);
            // Don't throw - proctoring failures should be silent
        }
    }, [sessionId]);

    /**
     * Start proctoring
     * @param {string} providedSessionId - Optional sessionId to use (overrides prop)
     */
    const startProctoring = useCallback(async (providedSessionId) => {
        const activeSessionId = providedSessionId || sessionId;

        if (!activeSessionId) {
            console.error('Cannot start proctoring: sessionId is required');
            return false;
        }

        // Request webcam permission
        const hasPermission = await requestWebcamPermission();
        if (!hasPermission) {
            return false;
        }

        // Initialize WebSocket with the active sessionId
        if (!wsRef.current) {
            try {
                const ws = new WebSocket(`${WS_BASE_URL}/proctoring/ws`);

                ws.onopen = () => {
                    console.log('✓ Proctoring WebSocket connected');
                    // Send initialization message
                    ws.send(JSON.stringify({
                        type: 'INIT',
                        sessionId: activeSessionId
                    }));
                };

                ws.onmessage = (event) => {
                    try {
                        const message = JSON.parse(event.data);
                        if (message.type === 'ERROR') {
                            console.error('WebSocket error:', message.message);
                        }
                    } catch (err) {
                        console.error('Failed to parse WebSocket message:', err);
                    }
                };

                ws.onerror = (error) => {
                    console.error('WebSocket error:', error);
                    setError('Proctoring connection failed. Exam will continue but may not be monitored.');
                };

                ws.onclose = () => {
                    console.log('WebSocket connection closed');
                };

                wsRef.current = ws;
            } catch (err) {
                console.error('Failed to create WebSocket:', err);
                setError('Failed to establish proctoring connection.');
            }
        }

        // Start frame capture interval (every 3 seconds)
        captureIntervalRef.current = setInterval(() => {
            captureFrame();
        }, 3000);

        setIsProctoring(true);
        console.log('✓ Proctoring started');
        return true;
    }, [sessionId, requestWebcamPermission, captureFrame]);

    /**
     * Stop proctoring and cleanup resources
     */
    const stopProctoring = useCallback(() => {
        // Stop frame capture
        if (captureIntervalRef.current) {
            clearInterval(captureIntervalRef.current);
            captureIntervalRef.current = null;
        }

        // Close WebSocket
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }

        // Stop video stream
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }

        // Cleanup video element
        if (videoRef.current) {
            videoRef.current.srcObject = null;
            videoRef.current = null;
        }

        setIsProctoring(false);
        console.log('✓ Proctoring stopped');
    }, []);

    // Setup browser event listeners
    useEffect(() => {
        if (!isActive || !isProctoring) return;

        const handleVisibilityChange = () => {
            if (document.hidden) {
                sendBrowserEvent('TAB_SWITCH', { timestamp: new Date().toISOString() });
            }
        };

        const handleWindowBlur = () => {
            sendBrowserEvent('WINDOW_BLUR', { timestamp: new Date().toISOString() });
        };

        const handleCopy = (e) => {
            sendBrowserEvent('COPY_PASTE', {
                action: 'copy',
                timestamp: new Date().toISOString()
            });
        };

        const handlePaste = (e) => {
            sendBrowserEvent('COPY_PASTE', {
                action: 'paste',
                timestamp: new Date().toISOString()
            });
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('blur', handleWindowBlur);
        document.addEventListener('copy', handleCopy);
        document.addEventListener('paste', handlePaste);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('blur', handleWindowBlur);
            document.removeEventListener('copy', handleCopy);
            document.removeEventListener('paste', handlePaste);
        };
    }, [isActive, isProctoring, sendBrowserEvent]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopProctoring();
        };
    }, [stopProctoring]);

    return {
        isProctoring,
        hasWebcamPermission,
        error,
        startProctoring,
        stopProctoring,
        requestWebcamPermission,
        sendBrowserEvent
    };
};

export default useProctoring;
