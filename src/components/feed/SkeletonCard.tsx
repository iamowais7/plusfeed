export default function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      {/* Thumbnail placeholder */}
      <div className="h-48 rounded-t-xl bg-gray-200 dark:bg-gray-700" />
      <div className="p-4 space-y-3">
        {/* Type badge */}
        <div className="h-4 w-16 rounded bg-gray-200 dark:bg-gray-700" />
        {/* Title */}
        <div className="h-5 w-full rounded bg-gray-200 dark:bg-gray-700" />
        <div className="h-5 w-3/4 rounded bg-gray-200 dark:bg-gray-700" />
        {/* Description */}
        <div className="h-4 w-full rounded bg-gray-200 dark:bg-gray-700" />
        <div className="h-4 w-5/6 rounded bg-gray-200 dark:bg-gray-700" />
        {/* Footer */}
        <div className="flex items-center justify-between pt-2">
          <div className="h-4 w-20 rounded bg-gray-200 dark:bg-gray-700" />
          <div className="flex gap-3">
            <div className="h-6 w-10 rounded bg-gray-200 dark:bg-gray-700" />
            <div className="h-6 w-10 rounded bg-gray-200 dark:bg-gray-700" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
