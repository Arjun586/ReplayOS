interface SkeletonProps {
    className?: string;
}

export function Skeleton({ className = "" }: SkeletonProps) {
    return (
        <div 
            className={`animate-pulse bg-surfaceBorder/30 rounded-md ${className}`} 
            aria-hidden="true"
        />
    );
}