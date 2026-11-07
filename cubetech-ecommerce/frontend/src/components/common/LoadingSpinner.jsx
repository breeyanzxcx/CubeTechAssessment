import { Loader2 } from 'lucide-react'

export function LoadingSpinner({ size = 'md', text = 'Loading...', fullPage = false, className = '' }) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  }[size] || 'h-8 w-8'

  const content = (
    <div className={`flex flex-col items-center justify-center gap-3 text-center ${className}`}>
      <Loader2 className={`${sizeClasses} animate-spin text-black`} />
      {text && <p className="text-sm font-medium text-gray-500">{text}</p>}
    </div>
  )

  if (fullPage) {
    return (
      <div className="flex min-h-[60vh] w-full items-center justify-center p-8">
        {content}
      </div>
    )
  }

  return content
}

export default LoadingSpinner

