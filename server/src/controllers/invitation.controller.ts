import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { createInvitationSchema, acceptInvitationSchema } from '../validations/invitation.schema';

const JWT_SECRET = process.env.JWT_SECRET ;

export const createInvitation = async (req: Request, res: Response) => {
    try {
        // 1. Validate the request body
        const data = createInvitationSchema.parse(req.body);

        // 2. Check if the user is already a member
        const existingMember = await prisma.user.findUnique({
            where: { email: data.email },
            include: {
                memberships: {
                    where: { organizationId: data.organizationId }
                }
            }
        });

        if (existingMember && existingMember.memberships.length > 0) {
            return res.status(400).json({ error: 'User is already a member of this organization' });
        }

        // 3. Check if an invitation already exists to prevent spam
        const existingInvitation = await prisma.invitation.findUnique({
            where: {
                email_organizationId: {
                    email: data.email,
                    organizationId: data.organizationId
                }
            }
        });

        if (existingInvitation) {
            return res.status(400).json({ error: 'An invitation is already pending for this email' });
        }

        // 4. Generate a secure random token
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days

        // 5. Create the Invitation record
        const invitation = await prisma.invitation.create({
            data: {
                email: data.email,
                organizationId: data.organizationId,
                role: data.role,
                token,
                expiresAt
            }
        });

        // TODO: Integrate SendGrid/Resend to email this token to the user
        // e.g. await sendEmail(data.email, `http://localhost:5173/invite/${token}`);

        return res.status(201).json({
            success: true,
            message: 'Invitation created successfully',
            data: {
                inviteLink: `http://localhost:5173/invite/${token}`
            }
        });

    } catch (error: any) {
        if (error.name === 'ZodError') {
            return res.status(400).json({ error: error.errors });
        }
        console.error('Error creating invitation:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

export const acceptInvitation = async (req: Request, res: Response) => {
    try {
        // 1. Validate the request body
        const data = acceptInvitationSchema.parse(req.body);

        // 2. Find the invitation and ensure it hasn't expired
        const invitation = await prisma.invitation.findUnique({
            where: { token: data.token },
            include: { organization: true }
        });

        if (!invitation) {
            return res.status(404).json({ error: 'Invalid or expired invitation token' });
        }

        if (new Date() > invitation.expiresAt) {
            // Cleanup the expired token
            await prisma.invitation.delete({ where: { id: invitation.id } });
            return res.status(400).json({ error: 'This invitation has expired' });
        }

        // 3. Check if user already exists
        let user = await prisma.user.findUnique({
            where: { email: invitation.email },
            include: { memberships: { include: { organization: true } } }
        });

        // 4. If they don't exist, create their account
        if (!user) {
            const passwordHash = await bcrypt.hash(data.password, 10);
            
            user = await prisma.user.create({
                data: {
                    email: invitation.email,
                    name: data.name,
                    passwordHash,
                    memberships: {
                        create: {
                            organizationId: invitation.organizationId,
                            role: invitation.role
                        }
                    }
                },
                include: { memberships: { include: { organization: true } } }
            });
        } else {
            // If they do exist, just link them to the organization
            await prisma.organizationMember.create({
                data: {
                    userId: user.id,
                    organizationId: invitation.organizationId,
                    role: invitation.role
                }
            });
            
            // Refresh user object to include the new membership
            user = await prisma.user.findUnique({
                where: { id: user.id },
                include: { memberships: { include: { organization: true } } }
            });
        }

        // 5. Delete the invitation so it can't be reused
        await prisma.invitation.delete({
            where: { id: invitation.id }
        });

        // 6. Generate JWT and log them in
        const jwtToken = jwt.sign(
            { id: user!.id, email: user!.email },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        const organizations = user!.memberships.map(m => m.organization);

        return res.status(200).json({
            token: jwtToken,
            user: {
                id: user!.id,
                email: user!.email,
                name: user!.name
            },
            organizations
        });

    } catch (error: any) {
        if (error.name === 'ZodError') {
            return res.status(400).json({ error: error.errors });
        }
        console.error('Error accepting invitation:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};