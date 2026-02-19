import { Router } from 'express';
import { apiRateLimiter } from '../middleware/rateLimitMiddleware.js';
import * as leadController from '../controllers/leadController.js';
const router = Router();

router.use(apiRateLimiter);

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