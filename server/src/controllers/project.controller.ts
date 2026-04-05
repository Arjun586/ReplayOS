
import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { createProjectSchema } from '../validations/project.schema';
import { z } from 'zod';

export const getProjects = async (req: Request, res: Response): Promise<void> => {
    try {
        const { orgId } = req.query;

        if (!orgId || typeof orgId !== 'string') {
            res.status(400).json({ success: false, message: "Organization ID is required" });
            return;
        }

        const projects = await prisma.project.findMany({
            where: {
                organizationId: orgId
            },
            orderBy: {
                createdAt: 'asc'
            }
        });

        res.status(200).json({ success: true, data: projects });
    } catch (error) {
        console.error("Error fetching projects:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const createProject = async (req: Request, res: Response): Promise<void> => {
    try {
        // Validate request body
        const validatedData = createProjectSchema.parse(req.body);

        // Optional: Ensure the organization actually exists before creating the project
        const orgExists = await prisma.organization.findUnique({
            where: { id: validatedData.organizationId }
        });

        if (!orgExists) {
            res.status(404).json({ success: false, message: "Organization not found" });
            return;
        }

        const project = await prisma.project.create({
            data: {
                name: validatedData.name,
                organizationId: validatedData.organizationId
            }
        });

        res.status(201).json({ success: true, data: project });
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ success: false, errors: error.issues });
            return;
        }
        console.error("Error creating project:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};