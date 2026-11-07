import { useState } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import {
  ShoppingBag,
  ArrowUpRight,
  ShieldCheck,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Menu,
  X,
  Package,
  Layers,
  FolderTree,
  Users,
  ChevronRight,
  User,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import ConfirmDialog from '../components/common/ConfirmDialog'

function AdminLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  const navItems = [
    {
      name: 'Dashboard',
      href: '/admin/dashboard',
      icon: LayoutDashboard,
      isActive: location.pathname === '/admin/dashboard' || location.pathname === '/admin',
    },
    {
      name: 'Orders',
      href: '/admin/orders',
      icon: ClipboardList,
      isActive: location.pathname.startsWith('/admin/orders'),
    },
    {
      name: 'Products',
      href: '/admin/products',
      icon: Package,
      isActive: location.pathname.startsWith('/admin/products'),
    },
    {
      name: 'Categories',
      href: '/admin/categories',
      icon: FolderTree,
      isActive: location.pathname.startsWith('/admin/categories'),
    },
    {
      name: 'Customers',
      href: '/admin/customers',
      icon: Users,
      isActive: location.pathname.startsWith('/admin/customers'),
    },
  ]

  const closeMobileMenu = () => setMobileMenuOpen(false)

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans flex flex-col">
      {/* 1. Desktop Fixed Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-gray-200 lg:bg-white lg:z-30 shadow-2xs">
        {/* Brand / Logo */}
        <div className="flex h-16 shrink-0 items-center border-b border-gray-100 px-6">
          <Link
            to="/admin/dashboard"
            className="flex items-center gap-2.5 text-lg font-bold tracking-tight text-gray-900 hover:opacity-90 transition"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-black text-white shadow-xs">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="flex flex-col text-left">
              <span className="leading-tight text-base font-bold">CubeTech</span>
              <span className="text-[10px] font-semibold tracking-wider uppercase text-gray-400">
                Admin Portal
              </span>
            </div>
          </Link>
        </div>

        {/* Sidebar Nav Links */}
        <div className="flex flex-1 flex-col justify-between overflow-y-auto px-4 py-6">
          <div className="space-y-6">
            <div>
              <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                Management
              </p>
              <nav className="mt-2 space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`group flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition ${
                        item.isActive
                          ? 'bg-gray-900 text-white shadow-xs'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`h-4 w-4 shrink-0 ${item.isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-900'}`} />
                        <span>{item.name}</span>
                      </div>
                      {item.isActive && (
                        <div className="h-1.5 w-1.5 rounded-full bg-white" />
                      )}
                    </Link>
                  )
                })}
              </nav>
            </div>

            <div>
              <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                Shortcuts
              </p>
              <div className="mt-2 space-y-1">
                <Link
                  to="/products"
                  target="_blank"
                  rel="noreferrer"
                  className="group flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100 hover:text-gray-900"
                >
                  <div className="flex items-center gap-3">
                    <ShoppingBag className="h-4 w-4 text-gray-400 group-hover:text-gray-900" />
                    <span>Customer Store</span>
                  </div>
                  <ArrowUpRight className="h-3.5 w-3.5 text-gray-400 group-hover:text-gray-900" />
                </Link>
              </div>
            </div>
          </div>

          {/* Admin User Profile & Logout at bottom of sidebar */}
          <div className="border-t border-gray-100 pt-4">
            <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black text-white text-xs font-bold uppercase">
                  {user?.name ? user.name.charAt(0) : 'A'}
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <p className="text-xs font-bold text-gray-900 truncate">{user?.name || 'Administrator'}</p>
                  <p className="text-[10px] text-gray-400 truncate">{user?.email || 'admin@cubetech.com'}</p>
                </div>
              </div>

              <button
                onClick={() => setShowLogoutConfirm(true)}
                title="Log out"
                aria-label="Sign out of administrator session"
                className="shrink-0 p-1.5 text-gray-400 rounded-lg hover:bg-rose-50 hover:text-rose-600 transition"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* 2. Mobile Header Bar */}
      <div className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 lg:hidden shadow-xs">
        <Link
          to="/admin/dashboard"
          className="flex items-center gap-2 text-base font-bold tracking-tight text-gray-900"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-black text-white">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <span className="font-bold">CubeTech Admin</span>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            to="/products"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900"
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Store</span>
            <ArrowUpRight className="h-3 w-3 text-gray-400" />
          </Link>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus:outline-hidden"
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* 3. Mobile Navigation Drawer (slide over) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-gray-900/40 backdrop-blur-xs transition-opacity"
            onClick={closeMobileMenu}
          />

          <div className="fixed inset-y-0 left-0 flex w-72 max-w-full flex-col bg-white shadow-xl">
            <div className="flex h-16 items-center justify-between border-b border-gray-100 px-6">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-black text-white">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <span className="font-bold text-gray-900">CubeTech Admin</span>
              </div>
              <button
                onClick={closeMobileMenu}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex flex-1 flex-col justify-between overflow-y-auto p-4">
              <nav className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={closeMobileMenu}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                        item.isActive
                          ? 'bg-gray-900 text-white'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.name}</span>
                    </Link>
                  )
                })}

                <div className="pt-4 border-t border-gray-100 mt-4">
                  <Link
                    to="/products"
                    target="_blank"
                    rel="noreferrer"
                    onClick={closeMobileMenu}
                    className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  >
                    <div className="flex items-center gap-3">
                      <ShoppingBag className="h-4 w-4 text-gray-400" />
                      <span>Customer Store</span>
                    </div>
                    <ArrowUpRight className="h-3.5 w-3.5 text-gray-400" />
                  </Link>
                </div>
              </nav>

              {user && (
                <div className="border-t border-gray-100 pt-4">
                  <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black text-white text-xs font-bold">
                        {user?.name ? user.name.charAt(0) : 'A'}
                      </div>
                      <div className="min-w-0 flex-1 text-left">
                        <p className="text-xs font-bold text-gray-900 truncate">{user.name}</p>
                        <p className="text-[10px] text-gray-400 truncate">{user.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        closeMobileMenu()
                        setShowLogoutConfirm(true)
                      }}
                      aria-label="Sign out of administrator session"
                      className="p-1.5 text-gray-400 hover:text-rose-600"
                    >
                      <LogOut className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. Desktop Main Content Wrapper (padded left for sidebar) */}
      <div className="lg:pl-64 flex flex-col flex-1 min-h-screen">
        {/* Desktop Top Header Bar */}
        <header className="hidden lg:flex h-16 items-center justify-between border-b border-gray-200 bg-white px-8 shadow-2xs">
          <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
            <span>Admin Portal</span>
            <ChevronRight className="h-3.5 w-3.5 text-gray-300" />
            <span className="text-gray-900 font-semibold capitalize">
              {location.pathname.replace('/admin/', '').replace('/admin', 'Dashboard') || 'Dashboard'}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              to="/products"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-gray-700 shadow-2xs transition hover:bg-gray-50 hover:text-gray-900"
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              <span>Live Storefront</span>
              <ArrowUpRight className="h-3 w-3 text-gray-400" />
            </Link>

            {user && (
              <div className="flex items-center gap-3 pl-3 border-l border-gray-200">
                <span className="text-xs font-medium text-gray-600">
                  Signed in as <strong className="text-gray-900">{user.name}</strong>
                </span>
              </div>
            )}
          </div>
        </header>

        {/* Main Routed Content */}
        <main className="flex-1 w-full bg-gray-50/50">
          <Outlet />
        </main>

        {/* Admin Footer */}
        <footer className="border-t border-gray-200 bg-white py-5 text-xs text-gray-400">
          <div className="mx-auto max-w-7xl px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>CubeTech E-Commerce Platform &bull; Administrative Control Center</span>
            <span>All rights reserved</span>
          </div>
        </footer>
      </div>

      {/* Admin Logout Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showLogoutConfirm}
        title="Sign Out of Admin Portal"
        message="Are you sure you want to terminate your administrator session?"
        confirmLabel="Sign Out"
        cancelLabel="Stay in Admin"
        variant="danger"
        onConfirm={async () => {
          setShowLogoutConfirm(false)
          await logout()
          navigate('/admin/login', { replace: true })
        }}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </div>
  )
}

export default AdminLayout
