import { AlertCircle, RefreshCw } from 'lucide-react'

export function ErrorMessage({
  title = 'Something went wrong',
  message = 'An unexpected error occurred while loading this content.',
  onRetry = null,
  className = '',
}) {
  return (
    <div
      role="alert"
      className={`mx-auto my-8 max-w-lg rounded-2xl border border-red-200 bg-red-50/90 p-6 text-center shadow-xs ${className}`}
    >
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
        <AlertCircle className="h-6 w-6" />
      </div>
      <h3 className="text-base font-bold text-gray-900">{title}</h3>
      <p className="mt-1.5 text-sm text-red-700 leading-relaxed">
        {typeof message === 'string' ? message : 'Please try again later.'}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          type="button"
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow-2xs transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Try Again</span>
        </button>
      )}
    </div>
  )
}

export default ErrorMessage

