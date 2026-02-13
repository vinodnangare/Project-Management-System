import { Router } from 'express';
import * as leadController from '../controllers/leadController.js';

const router = Router();

router.get('/stats', leadController.getLeadStats);
router.get('/owners', leadController.getAssignableOwners);

router.get('/', leadController.getAllLeads);
router.get('/:id', leadController.getLeadById);
router.post('/', leadController.createLead);
router.put('/:id', leadController.updateLead);
router.patch('/:id/stage', leadController.updateLeadStage);
router.delete('/:id', leadController.deleteLead);

export default router;
