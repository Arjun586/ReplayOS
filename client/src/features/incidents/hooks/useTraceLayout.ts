// client/src/features/incidents/hooks/useTraceLayout.ts
import { useMemo } from 'react';
import type { TraceGraph, TraceGraphNode } from '../api/incident.service';

export const LAYOUT_CONFIG = {
    nodeWidth: 220,
    nodeHeight: 75,
    levelWidth: 350,
    verticalSpacing: 150,
    centerY: 400
};

export function useTraceLayout(graphData: TraceGraph | null) {
    return useMemo(() => {
        // FIX: Always return the config so it's never 'undefined'
        if (!graphData) {
            return { 
                nodePositions: new Map<string, { x: number; y: number }>(), 
                levels: [],
                config: LAYOUT_CONFIG 
            };
        }

        const nodePositions = new Map<string, { x: number; y: number }>();
        const incomingEdgeCounts = new Map<string, number>();

        graphData.nodes.forEach(n => incomingEdgeCounts.set(n.id, 0));
        graphData.edges.forEach(e => incomingEdgeCounts.set(e.target, (incomingEdgeCounts.get(e.target) || 0) + 1));
        const roots = graphData.nodes.filter(n => incomingEdgeCounts.get(n.id) === 0);

        const levels: TraceGraphNode[][] = [];
        let currentLevel = roots;
        const processed = new Set<string>();

        while (currentLevel.length > 0) {
            levels.push(currentLevel);
            currentLevel.forEach(n => processed.add(n.id));
            const nextLevel: TraceGraphNode[] = [];
            currentLevel.forEach(node => {
                graphData.edges.filter(e => e.source === node.id).forEach(edge => {
                    const child = graphData.nodes.find(n => n.id === edge.target);
                    if (child && !processed.has(child.id) && !nextLevel.find(n => n.id === child.id)) {
                        nextLevel.push(child);
                    }
                });
            });
            currentLevel = nextLevel;
        }

        levels.forEach((levelNodes, depth) => {
            const totalHeight = levelNodes.length * LAYOUT_CONFIG.verticalSpacing;
            const startY = LAYOUT_CONFIG.centerY - (totalHeight / 2) + (LAYOUT_CONFIG.verticalSpacing / 2);
            levelNodes.forEach((node, i) => {
                nodePositions.set(node.id, { 
                    x: depth * LAYOUT_CONFIG.levelWidth + 100, 
                    y: startY + i * LAYOUT_CONFIG.verticalSpacing 
                });
            });
        });

        return { nodePositions, levels, config: LAYOUT_CONFIG };
    }, [graphData]);
}