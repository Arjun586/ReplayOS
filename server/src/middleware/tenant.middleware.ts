import { Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from './auth.middleware';

export const authorizeProjectAccess = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.user?.id;
    // Extract projectId from Query (GET) or Body (POST)
    const projectId = (req.query.projectId as string) || req.body.projectId || req.params.projectId;

    if (!projectId || !userId) {
        return res.status(400).json({ success: false, error: "Project context required." });
    }

    try {
        // Verification: User must belong to the Org that owns this Project
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: { 
                organization: { 
                    include: { 
                        members: { where: { userId } } 
                    } 
                } 
            }
        });

        if (!project || project.organization.members.length === 0) {
            return res.status(403).json({ success: false, error: "Unauthorized access to this project." });
        }

        next();
    } catch (error) {
        res.status(500).json({ success: false, error: "Authorization check failed." });
    }
};