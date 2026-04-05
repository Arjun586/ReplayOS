import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { registerSchema, loginSchema } from '../validations/auth.schema';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-development-key';

export const register = async (req: Request, res: Response) => {
    try {
        // 1. Validate Input
        const data = registerSchema.parse(req.body);

        // 2. Check for existing user
        const existingUser = await prisma.user.findUnique({ 
            where: { email: data.email } 
            });
        
        if (existingUser) {
            return res.status(400).json({ error: 'User with this email already exists' });
        }

        // 3. Hash Password
        const passwordHash = await bcrypt.hash(data.password, 10);

        // 4. Atomic Nested Write: Create User -> OrgMember -> Organization -> Project
        const user = await prisma.user.create({
        data: {
            email: data.email,
            passwordHash,
            name: data.name,
            memberships: {
            create: {
                role: 'ADMIN', // First user is the admin
                organization: {
                create: {
                    name: data.organizationName,
                    slug: data.organizationName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                    projects: {
                        create: {
                            name: 'Default Project' // Give them an immediate workspace
                        }
                    }
                }
                }
            }
            }
        },
        // Include memberships in the response so we have the newly generated Org ID
        include: {
            memberships: {
                include: {
                    organization: true
                }
            }
        }
        });

        // 5. Generate JWT
        const token = jwt.sign(
            { id: user.id, email: user.email }, 
            JWT_SECRET, 
            { expiresIn: '7d' }
        );

        // Extract the primary organization for the client response
        const primaryOrg = user.memberships?.[0]
            ? {
                ...user.memberships[0].organization,
                role: user.memberships[0].role
            }
            : null;

        return res.status(201).json({
            token,
            user: { id: user.id, email: user.email, name: user.name },
            organization: primaryOrg
        });

    } catch (error: any) {
        if (error.name === 'ZodError') {
            return res.status(400).json({ error: error.errors });
        }
        return res.status(500).json({ error: 'Internal server error during registration' });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const data = loginSchema.parse(req.body);

        // 1. Find User
        const user = await prisma.user.findUnique({ 
            where: { email: data.email },
            include: {
                memberships: {
                include: { organization: true }
                }
            }
        });

        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // 2. Verify Password
        const isValidPassword = await bcrypt.compare(data.password, user.passwordHash);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // 3. Generate JWT
        const token = jwt.sign(
            { id: user.id, email: user.email }, 
            JWT_SECRET, 
            { expiresIn: '7d' }
        );

        const organizations = user.memberships?.map(m => ({
            ...m.organization,
            role: m.role
        })) || [];

        return res.status(200).json({
            token,
            user: { id: user.id, email: user.email, name: user.name },
            organizations
        });

    } catch (error: any) {
        if (error.name === 'ZodError') {
            return res.status(400).json({ error: error.errors });
        }
        return res.status(500).json({ error: 'Internal server error during login' });
    }
};