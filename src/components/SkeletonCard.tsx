export default function SkeletonCard() {
  return (
    <div className="glass-card overflow-hidden p-3">
      <div className="skeleton-shimmer aspect-video rounded-xl" />
      <div className="p-3">
        <div className="skeleton-shimmer h-4 w-24 rounded-full" />
        <div className="skeleton-shimmer mt-4 h-7 w-4/5 rounded-lg" />
        <div className="skeleton-shimmer mt-3 h-4 w-2/3 rounded-lg" />
        <div className="mt-5 flex gap-2">
          <div className="skeleton-shimmer h-6 w-16 rounded-full" />
          <div className="skeleton-shimmer h-6 w-20 rounded-full" />
        </div>
      </div>
    </div>
  );
}
