export function Skeleton({ className = '' }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-gray-200/80 ${className}`}
      aria-hidden="true"
    />
  )
}

export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col rounded-2xl border border-gray-200 bg-white p-4 shadow-2xs">
      <Skeleton className="mb-4 h-48 w-full rounded-xl" />
      <Skeleton className="h-4 w-24 mb-2" />
      <Skeleton className="h-5 w-3/4 mb-3" />
      <Skeleton className="h-6 w-20 mb-2" />
      <Skeleton className="h-4 w-16 mb-4" />
      <div className="mt-auto flex flex-col gap-2">
        <Skeleton className="h-9 w-full rounded-lg" />
        <Skeleton className="h-9 w-full rounded-lg" />
      </div>
    </div>
  )
}

export function TableRowSkeleton({ columns = 5 }) {
  return (
    <tr className="border-b border-gray-100">
      {Array.from({ length: columns }).map((_, idx) => (
        <td key={idx} className="p-4">
          <Skeleton className="h-4 w-full max-w-[120px]" />
        </td>
      ))}
    </tr>
  )
}

export default Skeleton

