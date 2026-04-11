import { useState, useEffect } from 'react';
import { apiClient } from '../../../core/api/client';

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

// 🚀 Naya signature jisme searchParams added hai
export function useIncidents(projectId: string | undefined, searchParams?: URLSearchParams, isLiveMode: boolean = false) {
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
                
                // Build query string from searchParams
                const params = new URLSearchParams(searchParams?.toString() || '');
                params.set('projectId', projectId); // Ensure project ID is always attached

                // 🚀 Call via apiClient to support dynamic query params from the URL
                const response = await apiClient.get(`/incidents?${params.toString()}`);
                
                if (isMounted) setIncidents(response.data.data);
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
    }, [projectId, searchParams?.toString(), isLiveMode]);

    return { incidents, isLoading, error };
}