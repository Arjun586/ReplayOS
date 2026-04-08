import { useState, useEffect } from 'react';
import { incidentService, type IncidentDetails } from '../api/incident.service';

export function useTimeline(incidentId: string | undefined) {
    const [incident, setIncident] = useState<IncidentDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!incidentId) return;

        const fetchTimeline = async () => {
            try {
                setIsLoading(true);
                const data = await incidentService.getIncidentTimeline(incidentId);
                setIncident(data);
            } catch (err) {
                console.error("Timeline fetch error:", err);
                setError("Failed to load incident details");
            } finally {
                setIsLoading(false);
            }
        };

        fetchTimeline();
    }, [incidentId]);

    return { incident, isLoading, error };
}