import { Outlet, Link, useLocation } from 'react-router-dom'
import { ShoppingCart, CheckCircle2, AlertCircle, X } from 'lucide-react'
import { useCart } from '../context/CartContext'

function CustomerLayout() {
  const { cartCount, toast, clearToast } = useCart()
  const location = useLocation()

  return (
    <div className="flex min-h-screen flex-col bg-white text-gray-900">
      {/* Toast Notification */}
      {toast && (
        <aside
          aria-label="Notification"
          className="fixed top-5 right-5 z-50 flex max-w-sm items-center gap-3 rounded-xl border p-4 shadow-lg backdrop-blur-md transition-all animate-in fade-in slide-in-from-top-4 bg-white/95"
          style={{
            borderColor: toast.type === 'error' ? '#fca5a5' : '#86efac',
          }}
        >
          {toast.type === 'error' ? (
            <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
          ) : (
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
          )}
          <p className="flex-1 text-sm font-medium text-gray-800">
            {toast.message}
          </p>
          <button
            onClick={clearToast}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close notification"
          >
            <X className="h-4 w-4" />
          </button>
        </aside>
      )}

      {/* Main Header / Navigation */}
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-8">
            <Link
              to="/products"
              className="text-2xl font-black tracking-tight text-black transition hover:opacity-80"
            >
              CubeTech
            </Link>

            <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
              <Link
                to="/products"
                className={`transition hover:text-black ${
                  location.pathname === '/products'
                    ? 'text-black font-semibold'
                    : 'text-gray-500'
                }`}
              >
                Products
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <Link
              to="/cart"
              className="relative flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-black hover:text-black"
            >
              <ShoppingCart className="h-4 w-4" />
              <span>Cart</span>
              {cartCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-black px-1.5 text-xs font-bold text-white">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* Page Content */}
      <div className="flex-1">
        <Outlet />
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-gray-50 py-8 text-center text-sm text-gray-500">
        <div className="mx-auto max-w-7xl px-6">
          <p>© {new Date().getFullYear()} CubeTech E-Commerce. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

export default CustomerLayout

