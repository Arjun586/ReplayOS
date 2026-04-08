import { Router } from 'express';
import { createInvitation, acceptInvitation } from '../controllers/invitation.controller';
import { authenticateUser } from '../middleware/auth.middleware';

const router = Router();

// In a real app, POST / should be protected by an authentication/RBAC middleware
router.post('/', authenticateUser, createInvitation);
router.post('/accept', acceptInvitation);

export default router;