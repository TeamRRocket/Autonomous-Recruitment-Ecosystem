import proctoringService from './proctoring.service.js';
import AppError from '../../utils/AppError.js';

class ProctoringController {
    /**
     * POST /api/proctoring/start
     * Start a new proctoring session
     */
    async startSession(req, res, next) {
        try {
            const { jobId, roundType, attemptId } = req.body;
            const userId = req.user.id;

            if (!jobId || !roundType || !attemptId) {
                return next(new AppError('Missing required fields: jobId, roundType, attemptId', 400));
            }

            if (!['APTITUDE', 'DSA'].includes(roundType)) {
                return next(new AppError('Invalid round type. Must be APTITUDE or DSA', 400));
            }

            const session = await proctoringService.startSession(userId, jobId, roundType, attemptId);

            res.status(201).json({
                status: 'success',
                data: { session }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/proctoring/event
     * Record a browser event (tab switch, blur, copy/paste)
     */
    async recordEvent(req, res, next) {
        try {
            const { sessionId, eventType, metadata } = req.body;

            if (!sessionId || !eventType) {
                return next(new AppError('Missing required fields: sessionId, eventType', 400));
            }

            const validEventTypes = ['TAB_SWITCH', 'WINDOW_BLUR', 'COPY_PASTE'];
            if (!validEventTypes.includes(eventType)) {
                return next(new AppError(`Invalid event type. Must be one of: ${validEventTypes.join(', ')}`, 400));
            }

            const event = await proctoringService.processBrowserEvent(sessionId, eventType, metadata || {});

            res.status(201).json({
                status: 'success',
                data: { event }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/proctoring/end
     * End proctoring session
     */
    async endSession(req, res, next) {
        try {
            const { sessionId } = req.body;

            if (!sessionId) {
                return next(new AppError('Missing required field: sessionId', 400));
            }

            const session = await proctoringService.endSession(sessionId);

            res.status(200).json({
                status: 'success',
                data: { session },
                message: 'Proctoring session ended. Risk evaluation in progress.'
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/proctoring/session/:sessionId
     * Get session summary with events and risk assessment
     */
    async getSessionSummary(req, res, next) {
        try {
            const { sessionId } = req.params;

            const summary = await proctoringService.getSessionSummary(sessionId);

            res.status(200).json({
                status: 'success',
                data: summary
            });
        } catch (error) {
            next(error);
        }
    }
}

export default new ProctoringController();
