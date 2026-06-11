export function SkeletonDetail() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Header section with action buttons */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="h-10 bg-gray-200 w-48"></div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="h-10 bg-gray-200 w-full sm:w-40"></div>
          <div className="h-10 bg-gray-200 w-full sm:w-32"></div>
        </div>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - main details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-gray-200 p-6">
            <div className="h-6 bg-gray-200 w-48 mb-6"></div>
            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex gap-4">
                  <div className="h-4 bg-gray-200 w-32"></div>
                  <div className="h-4 bg-gray-200 flex-1"></div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-gray-200 p-6">
            <div className="h-6 bg-gray-200 w-48 mb-6"></div>
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex gap-4">
                  <div className="h-4 bg-gray-200 w-32"></div>
                  <div className="h-4 bg-gray-200 flex-1"></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column - sidebar */}
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 p-6">
            <div className="h-6 bg-gray-200 w-32 mb-4"></div>
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 border border-gray-200"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
