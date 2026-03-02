import { Router } from 'express';
import { apiRateLimiter } from '../middleware/rateLimitMiddleware.js';
import { requireAdmin } from '../middleware/authMiddleware.js';
import * as leadController from '../controllers/leadController.js';
import * as leadStageController from '../controllers/leadStageController.js';
const router = Router();

router.use(apiRateLimiter);

// Settings
router.get('/settings/stages', leadStageController.getLeadStages);
router.post('/settings/stages', requireAdmin, leadStageController.createLeadStage);
router.put('/settings/stages/:id', requireAdmin, leadStageController.updateLeadStage);
router.delete('/settings/stages/:id', requireAdmin, leadStageController.deleteLeadStage);

router.get('/stats', leadController.getLeadStats);
router.get('/owners', leadController.getAssignableOwners);
router.get('/', leadController.getAllLeads);
router.get('/:id', leadController.getLeadById);
router.post('/', leadController.createLead);
router.patch('/:id/stage', leadController.updateLeadStage);
router.put('/:id', leadController.updateLead);
router.delete('/:id', leadController.deleteLead);

// TODO: Add more lead routes here

export default router;