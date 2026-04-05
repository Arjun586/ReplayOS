import { z } from 'zod';

export const createProjectSchema = z.object({
    name: z.string().min(2, "Project name must be at least 2 characters long"),
    organizationId: z.string().uuid("Invalid organization ID"),
});