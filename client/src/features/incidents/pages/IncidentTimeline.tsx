// client/src/features/incidents/pages/IncidentTimeline.tsx
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { ArrowLeft, AlertCircle, Info, AlertTriangle, FileTerminal, FileText } from 'lucide-react';

// Components & Hooks
import PostmortemModal from '../components/PostmortemModal';
import { useTimeline } from '../hooks/useTimeline';

export default function IncidentTimeline() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [isModalOpen, setIsModalOpen] = useState(false);

    
    const { incident, isLoading, error } = useTimeline(id);

    // Helper to color-code different types of logs
    const getEventStyles = (level: string) => {
        switch (level.toUpperCase()) {
            case 'ERROR': return { color: 'text-red-500', bg: 'bg-red-500/10', icon: <AlertCircle size={16} /> };
            case 'WARNING': return { color: 'text-orange-500', bg: 'bg-orange-500/10', icon: <AlertTriangle size={16} /> };
            default: return { color: 'text-blue-400', bg: 'bg-blue-500/10', icon: <Info size={16} /> };
        }
    };

    // UI States
    if (isLoading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="p-10 text-muted animate-pulse font-mono">Reconstructing timeline...</div>
        </div>
    );

    if (error || !incident) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <div className="text-red-500 font-medium">{error || "Incident not found."}</div>
            <button onClick={() => navigate('/')} className="text-primary hover:underline flex items-center gap-2">
                <ArrowLeft size={16} /> Return to safety
            </button>
        </div>
    );

    return (
        <div className="w-full max-w-4xl mx-auto pb-20 px-4">
            
            {/* Header & Back Button */}
            <button 
                onClick={() => navigate('/')} 
                className="flex items-center gap-2 text-muted hover:text-gray-200 transition-colors mb-8 group"
            >
                <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> 
                Back to Dashboard
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
                
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-md font-medium transition-all shadow-[0_0_15px_rgba(139,92,246,0.3)] flex items-center gap-2 active:scale-95"
                >
                    <FileText size={18} /> 
                    <span>Generate Post-mortem</span>
                </button>
            </div>

            {/* Postmortem Modal */}
            <PostmortemModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                incidentTitle={incident.title}
                severity={incident.severity}
                events={incident.events}
            />

            {/* The Animated Timeline */}
            <div className="relative pl-6 border-l-2 border-surfaceBorder space-y-8 ml-4">
                {incident.events.map((event, index) => {
                    const styles = getEventStyles(event.level);
                    
                    return (
                        <motion.div 
                            key={event.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1, type: 'spring', stiffness: 100 }}
                            className="relative"
                        >
                            {/* Timeline Node */}
                            <div className={`absolute -left-[35px] top-1 w-4 h-4 rounded-full border-4 border-background ${styles.bg} ${styles.color} flex items-center justify-center`}>
                                <div className="w-1.5 h-1.5 rounded-full bg-current shadow-[0_0_8px_currentColor]" />
                            </div>

                            {/* Event Card */}
                            <div className="bg-surface border border-surfaceBorder rounded-xl p-4 shadow-sm hover:shadow-md hover:border-surfaceBorder/80 transition-all group">
                                <div className="flex justify-between items-start mb-2">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-widest ${styles.bg} ${styles.color} flex items-center gap-1.5`}>
                                        {styles.icon} {event.level}
                                    </span>
                                    <span className="text-xs text-muted font-mono bg-background/50 px-2 py-1 rounded">
                                        {format(new Date(event.timestamp), 'HH:mm:ss.SSS')}
                                    </span>
                                </div>
                                
                                <p className="text-gray-200 text-sm font-mono mt-3 leading-relaxed break-words">
                                    {event.message}
                                </p>
                                
                                <div className="mt-4 pt-3 border-t border-surfaceBorder/50 flex flex-wrap gap-4 text-[11px] text-muted">
                                    <div className="flex gap-1.5">
                                        <span className="text-gray-500 uppercase font-semibold tracking-tighter">Service:</span> 
                                        <span className="text-gray-300">{event.service}</span>
                                    </div>
                                    {event.correlationId && (
                                        <div className="flex gap-1.5">
                                            <span className="text-gray-500 uppercase font-semibold tracking-tighter">Trace:</span> 
                                            <span className="text-primary/80 font-mono">{event.correlationId}</span>
                                        </div>
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