// client/src/features/incidents/hooks/useInfiniteCanvas.ts
import { useMotionValue, animate } from 'framer-motion';
import React, { useEffect } from 'react';

export function useInfiniteCanvas(containerRef: React.RefObject<HTMLDivElement | null>) {
    const scale = useMotionValue(1);
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleNativeWheel = (e: WheelEvent) => {
            // 1. Only hijack the scroll if Ctrl (Windows) or Cmd (Mac) is held
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault(); // Stop the page from zooming natively
                
                const zoomSpeed = 0.002; // Tweaked slightly for a smoother Ctrl+Wheel feel
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
            // 2. If no key is held, we do nothing and the page scrolls normally!
        };

        container.addEventListener('wheel', handleNativeWheel, { passive: false });

        return () => {
            container.removeEventListener('wheel', handleNativeWheel);
        };
    }, [containerRef, scale, x, y]);

    const resetView = () => {
        animate(x, 0, { duration: 0.5 });
        animate(y, 0, { duration: 0.5 });
        animate(scale, 1, { duration: 0.5 });
    };

    return { x, y, scale, resetView };
}