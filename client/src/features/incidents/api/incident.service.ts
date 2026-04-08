// client/src/api/incident.service.ts
import { apiClient } from '../../../core/api/client';

// Type definition yahan rakhna best hai
export interface Incident {
    id: string;
    title: string;
    status: string;
    severity: string;
    createdAt: string;
}

export interface LogEvent {
    id: string;
    timestamp: string;
    level: string;
    message: string;
    service: string;
    correlationId: string | null;
}

export interface IncidentDetails {
    id: string;
    title: string;
    description: string;
    status: string;
    severity: string;
    events: LogEvent[];
}

export const incidentService = {
    // Fetch all incidents for a project
    getIncidentsByProject: async (projectId: string): Promise<Incident[]> => {
        const response = await apiClient.get(`/incidents?projectId=${projectId}`);
        return response.data.data;
    },

    // Fetch single incident timeline
    getIncidentTimeline: async (incidentId: string) => {
        const response = await apiClient.get(`/incidents/${incidentId}/timeline`);
        return response.data.data;
    }
};