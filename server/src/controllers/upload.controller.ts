import { Request, Response } from 'express';
import { logQueue } from '../workers/log.worker';

// Handles the logic after a file has been successfully uploaded via Multer
export const uploadLogFile = async (req: Request, res: Response): Promise<void> => {
    try {
        // Guard clause: Reject if the Multer middleware failed to process the file
        if (!req.file) {
            res.status(400).json({ success: false, message: 'No file uploaded' });
            return;
        }

        // Guard clause: Ensure the upload is scoped to a valid project context
        const { projectId } = req.body;
        if (!projectId) {
            res.status(400).json({ success: false, message: 'projectId is required' });
            return;
        }

        // Dispatch a background job to Redis, passing the local file path
        await logQueue.add('process-logs', {
            filePath: req.file.path, 
            originalName: req.file.originalname,
            projectId: projectId
        }, {
            removeOnComplete: true, // Keep Redis memory footprint low
            removeOnFail: { count: 100 }, // Retain limited history for debugging
            attempts: 3, // Automatically retry transient failures
            backoff: { type: 'exponential', delay: 5000 } // Space out retries
        });

        res.status(202).json({ 
            success: true, 
            message: "Logs are being processed in the background!"
        });
    } catch (error) {
        console.error("[Upload Controller] Error:", error);     
        res.status(500).json({ success: false, message: "Internal server error during upload" });   
    }
};