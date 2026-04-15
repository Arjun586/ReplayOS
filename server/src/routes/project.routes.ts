// server/src/routes/project.routes.ts
import { Router } from 'express';
import { getProjects, createProject, simulateTraffic, getProjectServices } from '../controllers/project.controller';
import { authenticateUser } from '../middleware/auth.middleware';
import {authorizeProjectAccess} from '../middleware/tenant.middleware';


const router = Router();

router.use(authenticateUser);
router.get('/', getProjects);
router.post('/', createProject);
router.post('/:projectId/simulate', authorizeProjectAccess,  simulateTraffic);
router.get('/:projectId/services', authorizeProjectAccess, getProjectServices);

export default router;