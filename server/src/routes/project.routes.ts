// server/src/routes/project.routes.ts
import { Router } from 'express';
import { getProjects, createProject } from '../controllers/project.controller';
import { authenticateUser } from '../middleware/auth.middleware';


const router = Router();

router.use(authenticateUser);
router.get('/', getProjects);
router.post('/', createProject);

export default router;