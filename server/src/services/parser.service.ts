
import fs from 'fs';
import { prisma } from '../lib/prisma';

export const parseLogFile = async (filePath: string, originalName: string, projectId: string) => {
    try {
        // Use asynchronous readFile to prevent blocking the Node.js Event Loop
        const fileContent = await fs.promises.readFile(filePath, 'utf-8');

        // Parse the text into a JavaScript Array
        const logs = JSON.parse(fileContent);

        // Ensure it's actually an array of logs before processing
        if (!Array.isArray(logs)) {
            throw new Error("Log file must contain a JSON array");
        }

        // Find the first ERROR in the file to name our Incident automatically
        const firstError = logs.find(log => log.level === 'ERROR');

        const incidentTitle = firstError 
            ? `Crash: ${firstError.message}` 
            : `Investigation: ${originalName}`;

        // Create the Incident attached to the specific Project
        const incident = await prisma.incident.create({
            data: {
                title: incidentTitle,
                description: `Auto-generated from uploaded log file: ${originalName}`,
                severity: firstError ? 'critical' : 'medium',
                projectId: projectId, 
            }
        });

        // Format all the log lines to match the Postgres LogEvent table
        const formattedEvents = logs.map(log => ({
            incidentId: incident.id,
            timestamp: new Date(log.timestamp),
            level: log.level,
            message: log.message,
            service: log.service || 'unknown',
            correlationId: log.correlationId || null,
        }));

        // Save all events to Postgres in one fast query
        await prisma.logEvent.createMany({
            data: formattedEvents,
        });

        // FIX 2: Asynchronously delete the file from local disk after successful parsing
        await fs.promises.unlink(filePath);

        return incident;

    } catch (error) {
        // FIX 3: Also delete the file asynchronously if parsing fails, preventing garbage buildup
        if (fs.existsSync(filePath)) {
            await fs.promises.unlink(filePath);
        }
        
        console.error("Error parsing log file:", error);
        throw error;
    }
};