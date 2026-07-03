export default function ListingCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-card bg-bg-card shadow-card">
      <div className="aspect-[4/3] w-full animate-pulse bg-bg-hover" />
      <div className="space-y-2 p-4">
        <div className="h-4 w-3/4 animate-pulse rounded bg-bg-hover" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-bg-hover" />
        <div className="h-5 w-1/3 animate-pulse rounded bg-bg-hover" />
      </div>
    </div>
  );
}
