import { ReactNode } from "react";

interface SkeletonShimmerProps {
  className?: string;
  children?: ReactNode;
}

export function SkeletonShimmer({ className = "" }: SkeletonShimmerProps) {
  return <div className={`skeleton-shimmer rounded-2xl ${className}`} />;
}

export function CardSkeleton() {
  return (
    <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
      <SkeletonShimmer className="h-4 w-3/4" />
      <SkeletonShimmer className="h-3 w-1/2" />
      <SkeletonShimmer className="h-3 w-full" />
      <SkeletonShimmer className="h-10 w-32" />
    </div>
  );
}

export function StatSkeleton() {
  return (
    <div className="bg-card rounded-2xl border border-border p-6 space-y-2">
      <SkeletonShimmer className="h-3 w-24" />
      <SkeletonShimmer className="h-8 w-16" />
    </div>
  );
}
