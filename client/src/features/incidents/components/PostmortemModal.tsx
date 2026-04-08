// client/src/components/PostmortemModal.tsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, CheckCircle2, FileText } from 'lucide-react';
import MDEditor from '@uiw/react-md-editor';
import { format } from 'date-fns';

type LogEvent = {
    timestamp: string;
    level: string;
    message: string;
    service: string;
};

type PostmortemProps = {
    isOpen: boolean;
    onClose: () => void;
    incidentTitle: string;
    severity: string;
    events: LogEvent[];
};

// HELPER: Generate the markdown string instantly (No useEffect needed!)
const generateTemplate = (title: string, severity: string, events: LogEvent[]) => {
    if (!events || events.length === 0) return '';

    const firstEvent = events[0];
    const lastEvent = events[events.length - 1];
    const duration = new Date(lastEvent.timestamp).getTime() - new Date(firstEvent.timestamp).getTime();
    const durationMinutes = Math.max(1, Math.round(duration / 60000));
    
    const errorEvents = events.filter(e => e.level === 'ERROR' || e.level === 'CRITICAL');
    const primaryService = errorEvents.length > 0 ? errorEvents[0].service : events[0].service;

    return `# Incident Postmortem: ${title}

    **Date:** ${format(new Date(firstEvent.timestamp), 'MMMM do, yyyy')}
    **Severity:** ${severity.toUpperCase()}
    **Primary Service Affected:** ${primaryService}
    **Time to Resolution (TTR):** ~${durationMinutes} minutes

    ---

    ## 1. Executive Summary
    Briefly summarize what happened, the impact on users, and how it was resolved.

    *(Auto-generated context: The incident began at ${format(new Date(firstEvent.timestamp), 'HH:mm:ss')} with an initial log from \`${firstEvent.service}\`. It escalated to an ERROR state, logging: "${errorEvents[0]?.message || 'Unknown error'}".)*

    ## 2. Impact
    * **User Impact:** 
    * **Revenue Impact:** 

    ## 3. Automated Timeline
    ${events.map(e => `- **${format(new Date(e.timestamp), 'HH:mm:ss')}** [${e.service}] - ${e.level}: ${e.message}`).join('\n')}

    ## 4. Root Cause
    * Why did this happen? (The 5 Whys)

    ## 5. Action Items
    * [ ] Fix the immediate bug
    * [ ] Add new alerts for this specific failure
    * [ ] Update documentation
    `;
    };

export default function PostmortemModal({ isOpen, onClose, incidentTitle, severity, events }: PostmortemProps) {
    
    // MAGIC FIX: We initialize the state directly using the helper function!
    const [markdown, setMarkdown] = useState(() => generateTemplate(incidentTitle, severity, events));
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(markdown);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <AnimatePresence>
        {isOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            />
            
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }} 
                animate={{ opacity: 1, scale: 1, y: 0 }} 
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-5xl h-[85vh] bg-surface border border-surfaceBorder rounded-xl shadow-2xl flex flex-col overflow-hidden"
            >
                <div className="flex items-center justify-between px-6 py-4 border-b border-surfaceBorder bg-surface/50">
                <div className="flex items-center gap-2">
                    <FileText className="text-primary" size={20} />
                    <h2 className="text-lg font-bold text-gray-100">Postmortem Generator</h2>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                    onClick={handleCopy}
                    className="flex items-center gap-2 px-3 py-1.5 bg-surfaceBorder hover:bg-surfaceBorder/80 text-gray-200 rounded-md transition-colors text-sm font-medium"
                    >
                    {copied ? <CheckCircle2 size={16} className="text-green-500" /> : <Copy size={16} />}
                    {copied ? 'Copied!' : 'Copy Markdown'}
                    </button>
                    <button onClick={onClose} className="text-muted hover:text-gray-200 transition-colors p-1">
                    <X size={20} />
                    </button>
                </div>
                </div>

                <div className="flex-1 overflow-hidden bg-[#0d1117]" data-color-mode="dark">
                <MDEditor
                    value={markdown}
                    onChange={(val) => setMarkdown(val || '')}
                    height="100%"
                    preview="live"
                    className="border-0 rounded-none"
                    style={{ borderRadius: 0, border: 'none' }}
                />
                </div>
            </motion.div>
            </div>
        )}
        </AnimatePresence>
    );
}