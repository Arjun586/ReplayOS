import React, { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { Server, AlertCircle, Clock, Loader2 } from "lucide-react";
import { traceService, type TraceGraph as TraceGraphType } from "../api/incident.service";

interface TraceGraphProps {
    traceId: string;
}

export default function TraceGraph({ traceId }: TraceGraphProps) {
    const [graphData, setGraphData] = useState<TraceGraphType | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchGraph = async () => {
        try {
            setIsLoading(true);
            const data = await traceService.getTraceGraph(traceId);
            setGraphData(data);
        } catch (err) {
            console.error("Failed to load trace graph", err);
            setError("Failed to generate dependency graph for this trace.");
        } finally {
            setIsLoading(false);
        }
        };

        fetchGraph();
    }, [traceId]);

    if (isLoading) {
        return (
        <div className="flex items-center justify-center p-12 bg-surfaceBorder/20 rounded-xl border border-surfaceBorder border-dashed">
            <Loader2 className="text-primary animate-spin mr-3" size={24} />
            <span className="text-muted font-medium">Analyzing service dependencies...</span>
        </div>
        );
    }

    if (error || !graphData || graphData.nodes.length === 0) {
        return (
        <div className="p-6 bg-surfaceBorder/10 rounded-xl border border-surfaceBorder text-center">
            <p className="text-muted text-sm">Dependency graph unavailable for this trace.</p>
        </div>
        );
    }

    // Simple Level-based layout calculation (MVP approach for Left-to-Right tree)
    const nodeWidth = 200;
    const nodeHeight = 70;
    const levelWidth = 300;
    
    // Figure out root node (has out-edges but no in-edges)
    const incomingEdgeCounts = new Map<string, number>();
    graphData.nodes.forEach(n => incomingEdgeCounts.set(n.id, 0));
    graphData.edges.forEach(e => {
        incomingEdgeCounts.set(e.target, (incomingEdgeCounts.get(e.target) || 0) + 1);
    });

    const roots = graphData.nodes.filter(n => incomingEdgeCounts.get(n.id) === 0);
  
    // Assign positions based on BFS depth
    const nodePositions = new Map<string, { x: number; y: number }>();
    let currentLevel = roots;
    let depth = 0;
  
    while (currentLevel.length > 0) {
        const nextLevel: typeof graphData.nodes = [];
        
        currentLevel.forEach((node, i) => {
        // Prevent infinite loops in cyclic graphs by checking if already positioned
        if (!nodePositions.has(node.id)) {
            nodePositions.set(node.id, {
            x: depth * levelWidth + 50,
            // Stagger Y position if multiple nodes in same level
            y: (i * (nodeHeight + 40)) + 50 
            });
            
            // Find children
            const childrenEdges = graphData.edges.filter(e => e.source === node.id);
            childrenEdges.forEach(edge => {
            const childNode = graphData.nodes.find(n => n.id === edge.target);
            if (childNode && !nextLevel.find(n => n.id === childNode.id)) {
                nextLevel.push(childNode);
            }
            });
        }
        });
    
        currentLevel = nextLevel;
        depth++;
    }

    // SVG total dimensions
    const maxX = Math.max(...Array.from(nodePositions.values()).map(p => p.x));
    const maxY = Math.max(...Array.from(nodePositions.values()).map(p => p.y));
    const svgWidth = Math.max(maxX + nodeWidth + 100, 600);
    const svgHeight = Math.max(maxY + nodeHeight + 100, 300);

    return (
        <div className="w-full overflow-x-auto bg-surface border border-surfaceBorder rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
            <Server className="text-primary" size={18} />
            <h3 className="font-bold text-gray-200">Service Dependency Graph</h3>
        </div>
      
        <div ref={containerRef} className="relative min-w-max" style={{ height: svgHeight, width: svgWidth }}>
            {/* Draw Edges (SVG Lines) */}
            <svg className="absolute inset-0 pointer-events-none" width={svgWidth} height={svgHeight}>
            <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#52525b" />
                </marker>
            </defs>
            {graphData.edges.map((edge, i) => {
                const sourcePos = nodePositions.get(edge.source);
                const targetPos = nodePositions.get(edge.target);
                if (!sourcePos || !targetPos) return null;

                // Draw line from right edge of source to left edge of target
                const startX = sourcePos.x + nodeWidth;
                const startY = sourcePos.y + (nodeHeight / 2);
                const endX = targetPos.x;
                const endY = targetPos.y + (nodeHeight / 2);
                
                // Simple bezier curve for smooth connector
                const controlPointX = startX + (endX - startX) / 2;

                return (
                <motion.path
                    key={i}
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.8, delay: i * 0.2 }}
                    d={`M ${startX} ${startY} C ${controlPointX} ${startY}, ${controlPointX} ${endY}, ${endX} ${endY}`}
                    fill="none"
                    stroke="#52525b"
                    strokeWidth="2"
                    markerEnd="url(#arrowhead)"
                />
                );
            })}
            </svg>

            {/* Draw Nodes (HTML/CSS Overlays) */}
            {graphData.nodes.map((node, i) => {
            const pos = nodePositions.get(node.id);
            if (!pos) return null;

            return (
                <motion.div
                key={node.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className={`absolute flex flex-col justify-center px-4 py-3 rounded-lg border shadow-sm backdrop-blur-sm
                    ${node.hasError 
                    ? "bg-red-500/10 border-red-500/50 text-red-100" 
                    : "bg-surfaceBorder/30 border-surfaceBorder hover:border-primary/50 text-gray-200"
                    }`}
                style={{
                    left: pos.x,
                    top: pos.y,
                    width: nodeWidth,
                    height: nodeHeight
                }}
                >
                <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-sm font-semibold truncate pr-2">
                    {node.service}
                    </span>
                    {node.hasError && <AlertCircle size={14} className="text-red-500 shrink-0" />}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted">
                    <Clock size={12} />
                    <span>{node.duration}ms</span>
                </div>
                </motion.div>
            );
            })}
        </div>
        </div>
    );
}