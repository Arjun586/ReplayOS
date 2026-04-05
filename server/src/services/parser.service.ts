// server/src/services/parser.service.ts
import fs from 'fs';
import { prisma } from '../lib/prisma';

export const parseLogFile = async (filePath: string, originalName: string, projectId: string) => {
    try {
        // Read the file from the local disk
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        
        // Parse the text into a JavaScript Array
        const logs = JSON.parse(fileContent);

        // Ensure it's actually an array of logs
        if (!Array.isArray(logs)) {
            throw new Error("Log file must contain a JSON array");
        }

        // Find the first ERROR in the file to name our Incident
        const firstError = logs.find(log => log.level === 'ERROR');
        const incidentTitle = firstError 
            ? `Crash: ${firstError.message}` 
            : `Investigation: ${originalName}`;

        

        // Create the Incident attached to the Project
        const incident = await prisma.incident.create({
            data: {
                title: incidentTitle,
                description: `Auto-generated from uploaded log file: ${originalName}`,
                severity: firstError ? 'critical' : 'medium',
                projectId: projectId, 
            }
        });

        // Format all the log lines to match our Postgres LogEvent table
        const formattedEvents = logs.map(log => ({
            incidentId: incident.id,
            timestamp: new Date(log.timestamp),
            level: log.level,
            message: log.message,
            service: log.service || 'unknown',
            correlationId: log.correlationId || null,
        }));

        // Save all events to Postgres in one fast query!
        await prisma.logEvent.createMany({
            data: formattedEvents,
        });

        return incident;

    } catch (error) {
        console.error("Error parsing log file:", error);
        throw error;
    }
};