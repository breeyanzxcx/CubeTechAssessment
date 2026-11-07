import { PackageOpen } from 'lucide-react'
import { Link } from 'react-router-dom'

export function EmptyState({
  icon: Icon = PackageOpen,
  title = 'No items found',
  description = 'There are no items matching your criteria at this moment.',
  actionLabel = null,
  actionTo = null,
  onAction = null,
  className = '',
}) {
  return (
    <div
      className={`mx-auto my-10 max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-2xs ${className}`}
    >
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-500">
        <Icon className="h-7 w-7" />
      </div>
      <h3 className="text-lg font-bold text-gray-900 tracking-tight">{title}</h3>
      <p className="mt-1.5 text-sm text-gray-500 leading-relaxed">{description}</p>
      
      {actionLabel && actionTo && (
        <div className="mt-6">
          <Link
            to={actionTo}
            className="inline-flex items-center justify-center rounded-xl bg-black px-5 py-2.5 text-xs font-semibold text-white shadow-2xs transition hover:bg-gray-800"
          >
            {actionLabel}
          </Link>
        </div>
      )}

      {actionLabel && onAction && !actionTo && (
        <div className="mt-6">
          <button
            type="button"
            onClick={onAction}
            className="inline-flex items-center justify-center rounded-xl bg-black px-5 py-2.5 text-xs font-semibold text-white shadow-2xs transition hover:bg-gray-800"
          >
            {actionLabel}
          </button>
        </div>
      )}
    </div>
  )
}

export default EmptyState

