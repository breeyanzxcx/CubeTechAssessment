import { Outlet, Link, useLocation } from 'react-router-dom'
import { ShoppingBag, ArrowUpRight, ShieldCheck, ClipboardList, LayoutDashboard, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

function AdminLayout() {
  const location = useLocation()
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 text-left flex flex-col font-sans">
      {/* Admin Top Navigation */}
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white shadow-xs">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5">
          <div className="flex items-center gap-8">
            <Link
              to="/admin/dashboard"
              className="flex items-center gap-2.5 text-xl font-bold tracking-tight text-gray-900 hover:opacity-90 transition"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-black text-white shadow-xs">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="leading-tight text-base font-bold">CubeTech</span>
                <span className="text-[10px] font-semibold tracking-wider uppercase text-gray-400">
                  Admin Portal
                </span>
              </div>
            </Link>

            <nav className="flex items-center gap-2">
              <Link
                to="/admin/dashboard"
                className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition ${
                  location.pathname === '/admin/dashboard' || location.pathname === '/admin'
                    ? 'bg-gray-100 text-gray-900 font-semibold'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <LayoutDashboard className="h-4 w-4" />
                <span>Dashboard</span>
              </Link>

              <Link
                to="/admin/orders"
                className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition ${
                  location.pathname.startsWith('/admin/orders')
                    ? 'bg-gray-100 text-gray-900 font-semibold'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <ClipboardList className="h-4 w-4" />
                <span>Orders</span>
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/products"
              target="_blank"
              rel="noreferrer"
              className="hidden sm:flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3.5 py-1.5 text-xs font-medium text-gray-600 shadow-2xs transition hover:border-gray-400 hover:text-gray-900"
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              <span>Customer Store</span>
              <ArrowUpRight className="h-3 w-3 text-gray-400" />
            </Link>

            {user && (
              <div className="flex items-center gap-3 pl-2 border-l border-gray-200">
                <div className="hidden md:flex flex-col text-right">
                  <span className="text-xs font-semibold text-gray-900">{user.name || 'Admin'}</span>
                  <span className="text-[10px] text-gray-400">{user.email}</span>
                </div>
                <button
                  onClick={logout}
                  title="Logout"
                  className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 shadow-2xs transition hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 w-full">
        <Outlet />
      </div>

      {/* Admin Footer */}
      <footer className="border-t border-gray-200 bg-white py-6 text-center text-xs text-gray-400">
        <div className="mx-auto max-w-7xl px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>CubeTech E-Commerce Management System</span>
          <span>Logged in as Administrator</span>
        </div>
      </footer>
    </div>
  )
}

export default AdminLayout
