import { useState, useEffect } from 'react';
import { incidentService } from '../api/incident.service';

interface Incident {
    id: string;
    title: string;
    description: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    status: 'open' | 'in_progress' | 'resolved';
    createdAt: string;
    updatedAt: string;
    projectId: string;
}

// 🚀 Naya parameter add kiya 'isLiveMode'
export function useIncidents(projectId: string | undefined, isLiveMode: boolean = false) {
    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;

        const fetchIncidents = async (showLoadingState = true) => {
            if (!projectId) return;

            try {
                if (showLoadingState) setIsLoading(true);
                setError(null);
                
                const data = await incidentService.getIncidentsByProject(projectId);
                
                if (isMounted) setIncidents(data);
            } catch (err) {
                console.error('Failed to fetch incidents:', err);
                if (isMounted) setError('Failed to load incidents');
            } finally {
                if (isMounted && showLoadingState) setIsLoading(false);
            }
        };

        fetchIncidents(true);

        let intervalId: any;
        
        // 🚀 Polling sirf tab chalegi jab Live Mode ON hoga
        if (isLiveMode) {
            intervalId = setInterval(() => {
                fetchIncidents(false); // Background refresh bina loading spinner ke
            }, 5000); // 5 seconds ki optimized polling
        }

        return () => {
            isMounted = false;
            if (intervalId) clearInterval(intervalId);
        };
    }, [projectId, isLiveMode]);

    return { incidents, isLoading, error };
}