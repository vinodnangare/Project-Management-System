import { Router } from 'express';
import { apiRateLimiter } from '../middleware/rateLimitMiddleware.js';
import * as meetingController from '../controllers/meetingController.js';

const router = Router();

router.use(apiRateLimiter);

// Dashboard widgets
router.get('/upcoming', meetingController.getUpcomingMeetings);
router.get('/today', meetingController.getTodaysMeetings);
router.get('/calendar', meetingController.getCalendarMeetings);

// Assignable users endpoint - must be before :id routes
router.get('/users/assignable', meetingController.getAssignableUsers);

// Related entity meetings
router.get('/lead/:leadId', meetingController.getMeetingsByLead);
router.get('/client/:clientId', meetingController.getMeetingsByClient);

// CRUD operations
router.get('/', meetingController.getAllMeetings);
router.get('/:id', meetingController.getMeetingById);
router.post('/', meetingController.createMeeting);
router.patch('/:id', meetingController.updateMeeting);
router.patch('/:id/status', meetingController.updateMeetingStatus);
router.delete('/:id', meetingController.deleteMeeting);

export default router;
