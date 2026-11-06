import { useState, useEffect } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import {
  ShoppingCart,
  CheckCircle2,
  AlertCircle,
  X,
  User,
  LogOut,
  Menu,
  ShoppingBag,
  ExternalLink,
} from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'

function CustomerLayout() {
  const { cartCount, toast, clearToast } = useCart()
  const { user, logout, isAdmin } = useAuth()
  const location = useLocation()

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname])

  return (
    <div className="flex min-h-screen flex-col bg-white text-gray-900 text-left font-sans">
      {/* Toast Notification Banner */}
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
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur-md shadow-2xs">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          {/* Left: Brand Logo & Desktop Nav Links */}
          <div className="flex items-center gap-8">
            <Link
              to="/"
              className="text-2xl font-black tracking-tight text-black transition hover:opacity-85 flex items-center gap-2"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-black text-white text-xs font-bold">
                C
              </div>
              <span>CubeTech</span>
            </Link>

            <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
              <Link
                to="/"
                className={`rounded-lg px-3 py-1.5 transition ${
                  location.pathname === '/'
                    ? 'text-black font-bold bg-gray-100'
                    : 'text-gray-600 hover:text-black hover:bg-gray-50'
                }`}
              >
                Home
              </Link>

              <Link
                to="/products"
                className={`rounded-lg px-3 py-1.5 transition ${
                  location.pathname === '/products'
                    ? 'text-black font-bold bg-gray-100'
                    : 'text-gray-600 hover:text-black hover:bg-gray-50'
                }`}
              >
                Products
              </Link>
            </nav>
          </div>

          {/* Right: Desktop Actions & Cart */}
          <div className="hidden md:flex items-center gap-3">
            {/* User Auth Section */}
            {user ? (
              <div className="flex items-center gap-3 border-r border-gray-200 pr-3">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-700">
                  <User className="h-3.5 w-3.5 text-gray-400" />
                  <span>{user.name}</span>
                </span>

                {isAdmin && (
                  <Link
                    to="/admin/orders"
                    className="rounded-md bg-gray-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-gray-800 hover:bg-gray-200 transition"
                  >
                    Admin Portal
                  </Link>
                )}

                <button
                  onClick={logout}
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-red-600 transition"
                  title="Log out"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 border-r border-gray-200 pr-3 text-xs font-semibold">
                <Link
                  to="/login"
                  className="text-gray-600 hover:text-black px-2.5 py-1.5 rounded-lg hover:bg-gray-50 transition"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="rounded-lg bg-black px-3.5 py-1.5 text-white hover:bg-gray-800 transition shadow-2xs"
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* Cart Button */}
            <Link
              to="/cart"
              className="relative flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-800 shadow-2xs transition hover:border-black hover:text-black"
            >
              <ShoppingCart className="h-4 w-4" />
              <span>Cart</span>
              {cartCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-black px-1.5 text-[10px] font-bold text-white">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>

          {/* Mobile Right Controls: Cart Pill + Hamburger Button */}
          <div className="flex md:hidden items-center gap-2">
            <Link
              to="/cart"
              className="relative flex items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-800"
            >
              <ShoppingCart className="h-4 w-4" />
              {cartCount > 0 && (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-black px-1 text-[9px] font-bold text-white">
                  {cartCount}
                </span>
              )}
            </Link>

            <button
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label="Toggle mobile menu"
              className="rounded-lg border border-gray-200 p-2 text-gray-700 hover:bg-gray-50"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white px-6 py-5 shadow-lg animate-in slide-in-from-top-2">
            <div className="space-y-3">
              <nav className="flex flex-col space-y-1 text-sm font-semibold">
                <Link
                  to="/"
                  className={`rounded-lg px-3 py-2 transition ${
                    location.pathname === '/'
                      ? 'bg-gray-100 text-black font-bold'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Home
                </Link>

                <Link
                  to="/products"
                  className={`rounded-lg px-3 py-2 transition ${
                    location.pathname === '/products'
                      ? 'bg-gray-100 text-black font-bold'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  All Products
                </Link>

                <Link
                  to="/cart"
                  className={`flex items-center justify-between rounded-lg px-3 py-2 transition ${
                    location.pathname === '/cart'
                      ? 'bg-gray-100 text-black font-bold'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span>Shopping Cart</span>
                  {cartCount > 0 && (
                    <span className="rounded-full bg-black px-2 py-0.5 text-xs text-white">
                      {cartCount}
                    </span>
                  )}
                </Link>
              </nav>

              <div className="border-t border-gray-100 pt-3">
                {user ? (
                  <div className="space-y-2">
                    <div className="px-3 text-xs text-gray-500">
                      Signed in as <strong className="text-gray-900">{user.name}</strong>
                    </div>

                    {isAdmin && (
                      <Link
                        to="/admin/orders"
                        className="block rounded-lg bg-gray-100 px-3 py-2 text-xs font-bold text-gray-800"
                      >
                        Admin Dashboard
                      </Link>
                    )}

                    <button
                      onClick={logout}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Log Out</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <Link
                      to="/login"
                      className="rounded-lg border border-gray-200 py-2.5 text-center text-xs font-semibold text-gray-700 hover:bg-gray-50"
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/register"
                      className="rounded-lg bg-black py-2.5 text-center text-xs font-semibold text-white hover:bg-gray-800"
                    >
                      Create Account
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Page Content */}
      <div className="flex-1 w-full">
        <Outlet />
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-gray-50 py-10 text-xs text-gray-500">
        <div className="mx-auto max-w-7xl px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-bold text-gray-800">
            <span>© {new Date().getFullYear()} CubeTech E-Commerce.</span>
            <span className="font-normal text-gray-400">All rights reserved.</span>
          </div>

          <div className="flex items-center gap-6 font-medium">
            <Link to="/" className="hover:text-black transition">
              Home
            </Link>
            <Link to="/products" className="hover:text-black transition">
              Catalog
            </Link>
            <Link to="/cart" className="hover:text-black transition">
              Cart
            </Link>
            <Link to="/admin/login" className="hover:text-black transition flex items-center gap-1">
              <span>Admin Portal</span>
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default CustomerLayout
