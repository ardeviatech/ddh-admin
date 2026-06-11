interface SkeletonTableProps {
  rows?: number;
  columns?: number;
}

export function SkeletonTable({ rows = 5, columns = 6 }: SkeletonTableProps) {
  return (
    <div className="animate-pulse">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className={`grid gap-6 px-6 py-4 border-b border-gray-200 ${
            rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'
          }`}
          style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div key={colIndex} className="h-4 bg-gray-200"></div>
          ))}
        </div>
      ))}
    </div>
  );
}
