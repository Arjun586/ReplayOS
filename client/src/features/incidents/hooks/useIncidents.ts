// client/src/hooks/useIncidents.ts
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

export function useIncidents(projectId: string | undefined) {
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
                
                // Fetch incidents from API
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

        const intervalId = setInterval(() => {
            fetchIncidents(false);
        }, 10000);

        return () => {
            isMounted = false;
            clearInterval(intervalId);
        };
    }, [projectId]);

    // Hook ye 3 cheezein return karega jo UI ko chahiye
    return { incidents, isLoading, error };
}