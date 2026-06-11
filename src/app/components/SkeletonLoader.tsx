export function SkeletonLoader() {
  return (
    <div className="animate-pulse">
      <div className="h-4 bg-gray-200 w-3/4 mb-4"></div>
      <div className="h-4 bg-gray-200 w-1/2 mb-4"></div>
      <div className="h-4 bg-gray-200 w-2/3"></div>
    </div>
  );
}

export function FormSkeletonLoader() {
  return (
    <div className="space-y-6 animate-pulse">
      {[1, 2, 3, 4, 5, 6].map((index) => (
        <div key={index} className="grid grid-cols-3 gap-4">
          <div>
            <div className="h-4 bg-gray-200 w-24 mb-2"></div>
            <div className="h-10 bg-gray-200"></div>
          </div>
          <div>
            <div className="h-4 bg-gray-200 w-24 mb-2"></div>
            <div className="h-10 bg-gray-200"></div>
          </div>
          <div>
            <div className="h-4 bg-gray-200 w-24 mb-2"></div>
            <div className="h-10 bg-gray-200"></div>
          </div>
        </div>
      ))}
    </div>
  );
}
