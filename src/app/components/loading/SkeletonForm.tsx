interface SkeletonFormProps {
  fields?: number;
}

export function SkeletonForm({ fields = 5 }: SkeletonFormProps) {
  return (
    <div className="bg-white border border-gray-200 p-6 animate-pulse space-y-6">
      {Array.from({ length: fields }).map((_, index) => (
        <div key={index}>
          <div className="h-4 bg-gray-200 w-32 mb-2"></div>
          <div className="h-12 bg-gray-200 w-full"></div>
        </div>
      ))}
      <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
        <div className="h-12 bg-gray-200 w-24"></div>
        <div className="h-12 bg-gray-200 w-32"></div>
      </div>
    </div>
  );
}
