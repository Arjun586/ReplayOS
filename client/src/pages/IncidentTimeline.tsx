// client/src/pages/IncidentTimeline.tsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { ArrowLeft, AlertCircle, Info, AlertTriangle, FileTerminal, FileText } from 'lucide-react';
import PostmortemModal from '../components/PostmortemModal'; // 
import { apiClient } from '../api/client';
// Define the exact shape of the data we get from our Express API
type LogEvent = {
    id: string;
    timestamp: string;
    level: string;
    message: string;
    service: string;
    correlationId: string | null;
};

type IncidentDetails = {
    id: string;
    title: string;
    description: string;
    status: string;
    severity: string;
    events: LogEvent[];
};

export default function IncidentTimeline() {
    const { id } = useParams<{ id: string }>(); // Grabs the "123" out of /incident/123
    const navigate = useNavigate();
    const [incident, setIncident] = useState<IncidentDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Fetch the massive timeline payload from our backend
    useEffect(() => {
        const fetchTimeline = async () => {
        try {
            const response = await apiClient.get(`/incidents/${id}/timeline`);
            setIncident(response.data.data);
        } catch (error) {
            console.error("Failed to fetch timeline", error);
        } finally {
            setIsLoading(false);
        }
        };
        fetchTimeline();
    }, [id]);

    // Helper to color-code different types of logs
    const getEventStyles = (level: string) => {
        switch (level.toUpperCase()) {
        case 'ERROR': return { color: 'text-red-500', bg: 'bg-red-500/10', icon: <AlertCircle size={16} /> };
        case 'WARNING': return { color: 'text-orange-500', bg: 'bg-orange-500/10', icon: <AlertTriangle size={16} /> };
        default: return { color: 'text-blue-400', bg: 'bg-blue-500/10', icon: <Info size={16} /> };
        }
    };

    if (isLoading) return <div className="p-10 text-muted animate-pulse">Reconstructing timeline...</div>;
    if (!incident) return <div className="p-10 text-red-500">Incident not found.</div>;

    return (
        <div className="w-full max-w-4xl mx-auto pb-20">
        
        {/* Header & Back Button */}
        <button 
            onClick={() => navigate('/')} 
            className="flex items-center gap-2 text-muted hover:text-gray-200 transition-colors mb-8"
        >
            <ArrowLeft size={16} /> Back to Dashboard
        </button>

            <div className="mb-12 flex justify-between items-start">
                    <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className={`p-2 rounded-lg ${getEventStyles(incident.severity === 'critical' ? 'ERROR' : 'WARNING').bg}`}>
                        <FileTerminal size={24} className={getEventStyles(incident.severity === 'critical' ? 'ERROR' : 'WARNING').color} />
                        </div>
                        <h1 className="text-3xl font-bold text-gray-100">{incident.title}</h1>
                    </div>
                    <p className="text-muted text-lg">{incident.description}</p>
                    </div>
                    
                    {/* THE NEW BUTTON */}
                    <button 
                    onClick={() => setIsModalOpen(true)}
                    className="bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-md font-medium transition-colors shadow-[0_0_15px_rgba(139,92,246,0.3)] flex items-center gap-2"
                    >
                    <FileText size={18} /> 
                    </button>
                </div>

                {/* THE MODAL COMPONENT (Hidden until isModalOpen is true) */}
                <PostmortemModal 
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    incidentTitle={incident.title}
                    severity={incident.severity}
                    events={incident.events}
        />

        {/* The Animated Timeline */}
        <div className="relative pl-6 border-l-2 border-surfaceBorder space-y-8">
            {incident.events.map((event, index) => {
            const styles = getEventStyles(event.level);
            
            return (
                // Framer Motion automatically staggers these onto the screen!
                <motion.div 
                key={event.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.15, type: 'spring', stiffness: 100 }} // 0.15s delay between each log
                className="relative"
                >
                {/* The glowing dot on the timeline line */}
                <div className={`absolute -left-[35px] top-1 w-4 h-4 rounded-full border-4 border-background ${styles.bg} ${styles.color} flex items-center justify-center`}>
                    <div className={`w-1.5 h-1.5 rounded-full bg-current`} />
                </div>

                {/* The Event Card */}
                <div className="bg-surface border border-surfaceBorder rounded-xl p-4 shadow-sm hover:shadow-md hover:border-surfaceBorder/80 transition-all">
                    <div className="flex justify-between items-start mb-2">
                    <span className={`text-xs font-bold px-2 py-1 rounded-md uppercase tracking-wider ${styles.bg} ${styles.color} flex items-center gap-1.5 w-fit`}>
                        {styles.icon} {event.level}
                    </span>
                    <span className="text-xs text-muted font-mono">
                        {format(new Date(event.timestamp), 'HH:mm:ss.SSS')}
                    </span>
                    </div>
                    
                    <p className="text-gray-200 text-sm font-mono mt-3 leading-relaxed">
                    {event.message}
                    </p>
                    
                    <div className="mt-4 pt-3 border-t border-surfaceBorder/50 flex gap-4 text-xs text-muted">
                    <span><strong className="text-gray-400 font-medium">Service:</strong> {event.service}</span>
                    {event.correlationId && (
                        <span><strong className="text-gray-400 font-medium">Trace ID:</strong> {event.correlationId}</span>
                    )}
                    </div>
                </div>
                </motion.div>
            );
            })}
        </div>
        </div>
    );
}