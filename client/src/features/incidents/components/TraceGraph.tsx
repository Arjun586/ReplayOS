import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";

import { traceService, type TraceGraph as TraceGraphType } from "../api/incident.service";
import { useTraceLayout } from "../hooks/useTraceLayout";
import { useInfiniteCanvas } from "../hooks/useInfiniteCanvas";

import { GraphHeader } from "./graph/GraphHeader";
import { GraphConnections } from "./graph/GraphConnections";
import { GraphNodes } from "./graph/GraphNodes";
import { NodeInspector } from "./graph/NodeInspector";

interface TraceGraphProps {
    traceId: string;
    onViewLogs?: (spanId: string) => void;
}

export default function TraceGraph({ traceId, onViewLogs }: TraceGraphProps) {
    const [graphData, setGraphData] = useState<TraceGraphType | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [selectedNode, setSelectedNode] = useState<any | null>(null);
    
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchGraph = async () => {
            try {
                setIsLoading(true);
                const data = await traceService.getTraceGraph(traceId);
                setGraphData(data);
            } catch {
                setError("Failed to generate dependency graph.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchGraph();
    }, [traceId]);

    // Headless logic delegation
    const { nodePositions, config } = useTraceLayout(graphData);
    const { x, y, scale, resetView } = useInfiniteCanvas(containerRef);

    // 🚀 THE FIX: Native Wheel Listener for Ctrl+Scroll zooming
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleNativeWheel = (e: WheelEvent) => {
            // ONLY intercept the wheel if Ctrl (Windows) or Cmd (Mac) is pressed
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault(); // Stop browser from zooming the whole page
                
                const zoomSpeed = 0.002;
                const delta = -e.deltaY;
                const newScale = Math.min(Math.max(scale.get() + delta * zoomSpeed, 0.2), 3);

                const rect = container.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                const mouseY = e.clientY - rect.top;
                const currentScale = scale.get();
                const scaleRatio = newScale / currentScale;

                x.set(mouseX - (mouseX - x.get()) * scaleRatio);
                y.set(mouseY - (mouseY - y.get()) * scaleRatio);
                scale.set(newScale);
            }
            // If Ctrl/Cmd is not pressed, the event is ignored and the page scrolls normally!
        };

        // Attach native listener with passive: false so preventDefault() works
        container.addEventListener('wheel', handleNativeWheel, { passive: false });

        return () => {
            container.removeEventListener('wheel', handleNativeWheel);
        };
    }, [scale, x, y, isLoading]); // Re-bind if motion values change

    // Modal Scroll Lock
    useEffect(() => {
        if (isFullscreen || selectedNode) document.body.style.overflow = "hidden";
        else document.body.style.overflow = "unset";
    }, [isFullscreen, selectedNode]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-[400px] bg-surfaceBorder/10 rounded-xl border border-dashed">
                <Loader2 className="text-primary animate-spin mr-3" />
            </div>
        );
    }

    if (error || !graphData) {
        return <div className="p-6 text-center text-muted">Graph unavailable.</div>;
    }

    return (
        <div 
            className={`flex flex-col bg-surface shadow-sm overflow-hidden transition-all duration-300 border-surfaceBorder ${
                isFullscreen ? "fixed inset-0 z-[100] w-screen h-screen" : "relative w-full h-[600px] border rounded-xl"
            }`}
        >
            <GraphHeader 
                resetView={resetView} 
                isFullscreen={isFullscreen} 
                setIsFullscreen={setIsFullscreen} 
            />

            <div 
                ref={containerRef}
                className="relative flex-1 bg-[#070708] cursor-grab active:cursor-grabbing overflow-hidden"
            >
                <motion.div style={{ x, y, scale }} className="absolute inset-0 pointer-events-none opacity-20">
                    <div className="absolute top-1/2 left-1/2 w-[20000px] h-[20000px] bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:40px_40px] -translate-x-1/2 -translate-y-1/2" />
                </motion.div>

                <motion.div drag dragMomentum={false} style={{ x, y, scale }} className="absolute inset-0 origin-center">
                    <div className="absolute top-1/2 left-1/2 w-[20000px] h-[20000px] -translate-x-1/2 -translate-y-1/2 bg-transparent" />

                    <GraphConnections edges={graphData.edges} nodes={graphData.nodes} positions={nodePositions} config={config} />
                    <GraphNodes nodes={graphData.nodes} positions={nodePositions} config={config} onSelectNode={setSelectedNode} />
                </motion.div>
            </div>

            <AnimatePresence>
                {selectedNode && (
                    <NodeInspector 
                        node={selectedNode} 
                        onClose={() => setSelectedNode(null)} 
                        onViewLogs={(id) => {
                            onViewLogs?.(id);
                            setSelectedNode(null);
                            setIsFullscreen(false);
                        }} 
                    />
                )}
            </AnimatePresence>
        </div>
    );
}