import { z } from 'zod';

export const createInvitationSchema = z.object({
    email: z.string().email("Invalid email address"),
    organizationId: z.string().uuid("Invalid Organization ID"),
    role: z.enum(['ADMIN', 'MEMBER']).default('MEMBER'),
});

export const acceptInvitationSchema = z.object({
    token: z.string().min(1, "Token is required"),
    name: z.string().min(2, "Name is required"),
    password: z.string().min(8, "Password must be at least 8 characters"),
});