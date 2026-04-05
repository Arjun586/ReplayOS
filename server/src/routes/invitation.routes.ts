import { Router } from 'express';
import { createInvitation, acceptInvitation } from '../controllers/invitation.controller';

const router = Router();

// In a real app, POST / should be protected by an authentication/RBAC middleware
router.post('/', createInvitation);
router.post('/accept', acceptInvitation);

export default router;