export function SkeletonCard() {
  return (
    <div className="bg-white border border-gray-200 p-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="h-4 bg-gray-200 w-24 mb-2"></div>
          <div className="h-8 bg-gray-200 w-16"></div>
        </div>
        <div className="w-12 h-12 bg-gray-200"></div>
      </div>
    </div>
  );
}
