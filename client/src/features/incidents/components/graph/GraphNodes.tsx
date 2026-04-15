import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Clock } from 'lucide-react';
import type { TraceGraphNode } from '../../api/incident.service';

interface GraphNodesProps {
    nodes: TraceGraphNode[];
    positions: Map<string, { x: number; y: number }>;
    config: { nodeWidth: number; nodeHeight: number };
    onSelectNode: (node: TraceGraphNode) => void;
}

export const GraphNodes = ({ nodes, positions, config, onSelectNode }: GraphNodesProps) => {
    return (
        <>
            {nodes.map((node) => {
                const pos = positions.get(node.id);
                if (!pos) return null;

                return (
                    <motion.div
                        key={node.id}
                        onClick={() => onSelectNode(node)}
                        whileHover={{ scale: 1.05, y: -5, boxShadow: "0 20px 40px rgba(0,0,0,0.4)" }}
                        className={`absolute p-4 rounded-xl border-2 backdrop-blur-xl cursor-pointer transition-colors duration-300
                            ${node.hasError ? "bg-red-500/10 border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.15)]" : "bg-surface/90 border-surfaceBorder"}
                        `} 
                        style={{ left: pos.x, top: pos.y, width: config.nodeWidth, height: config.nodeHeight }}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <span className="font-mono text-xs font-bold text-gray-200">{node.service}</span>
                            {node.hasError && <AlertCircle size={14} className="text-red-500" />}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-muted font-mono bg-black/40 px-2 py-1 rounded w-fit">
                            <Clock size={10} className={node.hasError ? "text-red-400" : "text-primary"} />
                            {node.duration}ms
                        </div>
                    </motion.div>
                );
            })}
        </>
    );
};