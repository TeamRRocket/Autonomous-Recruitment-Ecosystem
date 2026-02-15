import { WebSocketServer } from 'ws';
import proctoringService from '../modules/proctoring/proctoring.service.js';

/**
 * Initialize WebSocket server for proctoring frame streaming
 * @param {http.Server} server - HTTP server instance
 */
export function initializeProctoringWebSocket(server) {
    const wss = new WebSocketServer({
        server,
        path: '/proctoring/ws'
    });

    console.log('✓ Proctoring WebSocket server initialized on /proctoring/ws');

    wss.on('connection', (ws, req) => {
        console.log('New proctoring WebSocket connection established');

        let sessionId = null;

        ws.on('message', async (data) => {
            try {
                const message = JSON.parse(data.toString());

                // Handle different message types
                switch (message.type) {
                    case 'INIT':
                        // Initialize connection with session ID
                        sessionId = message.sessionId;
                        console.log(`WebSocket initialized for session: ${sessionId}`);
                        ws.send(JSON.stringify({
                            type: 'ACK',
                            message: 'Connection initialized'
                        }));
                        break;

                    case 'FRAME':
                        // Process frame data
                        if (!sessionId) {
                            ws.send(JSON.stringify({
                                type: 'ERROR',
                                message: 'Session not initialized'
                            }));
                            return;
                        }

                        // Process frame asynchronously (non-blocking)
                        proctoringService.processFrame(sessionId, message.frameData)
                            .then(result => {
                                if (result) {
                                    ws.send(JSON.stringify({
                                        type: 'FRAME_PROCESSED',
                                        data: result
                                    }));
                                }
                            })
                            .catch(err => {
                                console.error('Frame processing error:', err.message);
                                // Don't send error to client - proctoring failures should be silent
                            });
                        break;

                    case 'PING':
                        // Keep-alive ping
                        ws.send(JSON.stringify({ type: 'PONG' }));
                        break;

                    default:
                        console.log(`Unknown message type: ${message.type}`);
                }
            } catch (error) {
                console.error('WebSocket message error:', error.message);
                ws.send(JSON.stringify({
                    type: 'ERROR',
                    message: 'Invalid message format'
                }));
            }
        });

        ws.on('close', () => {
            console.log(`WebSocket connection closed for session: ${sessionId || 'unknown'}`);
        });

        ws.on('error', (error) => {
            console.error('WebSocket error:', error.message);
        });
    });

    return wss;
}
