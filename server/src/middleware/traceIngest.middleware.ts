// server/src/middleware/traceIngest.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';

export const authenticateIngest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const projectId = req.headers['x-project-id'] as string;
        const ingestKey = req.headers['x-ingest-key'] as string;

        // 1. Ensure both headers are provided
        if (!projectId || !ingestKey) {
            res.status(401).json({ 
                success: false, 
                error: "Missing x-project-id or x-ingest-key headers." 
            });
            return;
        }

        // 2. Verify the project and the key in the database
        const project = await prisma.project.findUnique({
            where: { id: projectId }
        });

        if (!project || project.ingestKey !== ingestKey) {
            res.status(401).json({ 
                success: false, 
                error: "Invalid Project ID or Ingest Key." 
            });
            return;
        }

        // 3. Attach projectId to the request so the controller can use it
        req.body.projectId = projectId;
        next();
    } catch (error) {
        console.error("Ingest Auth Error:", error);
        res.status(500).json({ success: false, error: "Internal server error during ingest authentication." });
    }
};