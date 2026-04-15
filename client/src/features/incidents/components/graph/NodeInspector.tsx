import React from 'react';
import { motion } from 'framer-motion';
import { ActivitySquare, X, ListTree } from 'lucide-react';
import type { TraceGraphNode } from '../../api/incident.service';

interface NodeInspectorProps {
    node: TraceGraphNode;
    onClose: () => void;
    onViewLogs: (id: string) => void;
}

export const NodeInspector = ({ node, onClose, onViewLogs }: NodeInspectorProps) => {
    return (
        <>
            <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
                onClick={onClose} 
                className="absolute inset-0 bg-black/60 backdrop-blur-sm z-[105]" 
            /> 
            <motion.div 
                initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} 
                transition={{ type: "spring", damping: 30 }} 
                className="absolute top-0 right-0 h-full w-[400px] bg-surface border-l border-surfaceBorder z-[110] p-6 shadow-2xl"
            > 
                <div className="flex justify-between items-center mb-8 pb-4 border-b border-surfaceBorder">
                    <h2 className="text-lg font-bold flex items-center gap-2"><ActivitySquare className="text-primary" /> Service Detail</h2>
                    <button onClick={onClose} className="p-1 hover:bg-surfaceBorder rounded"><X /></button>
                </div>
                <div className="space-y-6">
                    <div className="bg-background/50 p-4 rounded-lg border border-surfaceBorder">
                        <label className="text-[10px] text-muted uppercase font-bold">Service Name</label>
                        <div className="text-xl font-mono text-gray-100">{node.service}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-background/50 p-4 rounded-lg border border-surfaceBorder">
                            <label className="text-[10px] text-muted uppercase font-bold">Total Duration</label>
                            <div className="text-lg font-mono text-primary">{node.duration}ms</div>
                        </div>
                        <div className="bg-background/50 p-4 rounded-lg border border-surfaceBorder">
                            <label className="text-[10px] text-muted uppercase font-bold">Status</label>
                            <div className={`text-lg font-bold ${node.hasError ? 'text-red-500' : 'text-green-500'}`}>
                                {node.hasError ? 'FAILING' : 'HEALTHY'}
                            </div>
                        </div>
                    </div>
                    <button 
                        onClick={() => onViewLogs(node.id)}
                        className="w-full bg-primary hover:bg-primary-hover text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all"
                    >
                        <ListTree size={18} /> Jump to Logs
                    </button>
                </div>
            </motion.div>
        </>
    );
};