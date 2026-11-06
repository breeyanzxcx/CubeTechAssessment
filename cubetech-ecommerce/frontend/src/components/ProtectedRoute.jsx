import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { RefreshCw, ShieldAlert } from 'lucide-react'

export function ProtectedRoute({ requiredRole = null, children }) {
  const { user, loading, isAuthenticated } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-8">
        <div className="text-center space-y-3">
          <RefreshCw className="mx-auto h-8 w-8 animate-spin text-gray-400" />
          <p className="text-sm font-medium text-gray-500">Checking authentication...</p>
        </div>
      </div>
    )
  }

  // Not logged in
  if (!isAuthenticated) {
    const loginPath = requiredRole === 'admin' ? '/admin/login' : '/login'
    return <Navigate to={loginPath} state={{ from: location }} replace />
  }

  // Role mismatch
  if (requiredRole && user?.role !== requiredRole) {
    if (requiredRole === 'admin') {
      return (
        <div className="mx-auto max-w-md my-16 rounded-2xl border border-red-200 bg-red-50 p-8 text-center shadow-xs">
          <ShieldAlert className="mx-auto h-12 w-12 text-red-500 mb-3" />
          <h2 className="text-xl font-bold text-gray-900">Access Restricted</h2>
          <p className="mt-2 text-sm text-gray-600">
            This area requires administrator privileges. You are currently logged in as a customer (<strong>{user?.email}</strong>).
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <Navigate to="/admin/login" state={{ from: location }} replace />
          </div>
        </div>
      )
    }

    // Customer route required but user is admin
    return children ? children : <Outlet />
  }

  return children ? children : <Outlet />
}

export default ProtectedRoute