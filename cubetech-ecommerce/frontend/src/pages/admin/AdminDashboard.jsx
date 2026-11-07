import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Package,
  ShoppingBag,
  Clock,
  CheckCircle2,
  Users,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  ArrowRight,
  ExternalLink,
  Layers,
} from 'lucide-react'
import { api } from '../../services/api'

function formatCurrency(amount) {
  const num = Number(amount) || 0
  return `₱${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default function AdminDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [refreshing, setRefreshing] = useState(false)

  const fetchDashboard = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true)
    else setLoading(true)
    setError(null)

    try {
      const response = await api.get('/admin/dashboard')
      if (response && response.success) {
        // Support both response.data and top-level response
        setData(response.data || response)
      } else {
        setError(response?.message || 'Failed to load dashboard data.')
      }
    } catch (err) {
      setError(err.message || 'An error occurred while fetching dashboard metrics.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchDashboard()
  }, [])

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="flex flex-col items-center justify-center py-24 text-gray-500">
          <RefreshCw className="h-8 w-8 animate-spin text-gray-400 mb-3" />
          <p className="text-sm font-medium">Loading dashboard metrics...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center text-rose-800">
          <p className="font-semibold text-base mb-1">Failed to Load Dashboard</p>
          <p className="text-sm mb-4 text-rose-600">{error}</p>
          <button
            onClick={() => fetchDashboard(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-rose-700"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Try Again
          </button>
        </div>
      </div>
    )
  }

  const summary = data?.summary || {}
  const totalProducts = data?.total_products ?? summary.total_products ?? 0
  const totalOrders = data?.total_orders ?? summary.total_orders ?? 0
  const pendingOrders = data?.pending_orders ?? summary.pending_orders ?? 0
  const completedOrders = data?.completed_orders ?? summary.completed_orders ?? 0
  const uniqueCustomers = data?.unique_customers ?? summary.unique_customers ?? 0
  const completedOrderSales = data?.completed_order_sales ?? data?.completed_sales ?? summary.completed_order_sales ?? 0
  const ordersByStatus = data?.orders_by_status || {}
  const lowStockAlerts = data?.low_stock_alerts || []
  const recentOrders = data?.recent_orders || []

  const statsCards = [
    {
      title: 'Total Products',
      value: totalProducts,
      subtext: `${summary.active_products ?? totalProducts} active in store`,
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-100',
    },
    {
      title: 'Total Orders',
      value: totalOrders,
      subtext: 'Lifetime orders placed',
      icon: ShoppingBag,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-100',
      link: '/admin/orders',
    },
    {
      title: 'Pending Orders',
      value: pendingOrders,
      subtext: pendingOrders > 0 ? 'Requires fulfillment review' : 'No pending orders',
      icon: Clock,
      color: pendingOrders > 0 ? 'text-amber-600' : 'text-gray-500',
      bgColor: pendingOrders > 0 ? 'bg-amber-50' : 'bg-gray-50',
      borderColor: pendingOrders > 0 ? 'border-amber-200' : 'border-gray-200',
      badge: pendingOrders > 0 ? 'Action Needed' : null,
      badgeColor: 'bg-amber-100 text-amber-800',
      link: '/admin/orders?status=Pending',
    },
    {
      title: 'Completed Orders',
      value: completedOrders,
      subtext: 'Successfully fulfilled',
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-100',
      link: '/admin/orders?status=Completed',
    },
    {
      title: 'Unique Customers',
      value: uniqueCustomers,
      subtext: 'Distinct customer reach',
      icon: Users,
      color: 'text-violet-600',
      bgColor: 'bg-violet-50',
      borderColor: 'border-violet-100',
    },
    {
      title: 'Completed-Order Sales',
      value: formatCurrency(completedOrderSales),
      subtext: 'Revenue from completed orders',
      icon: TrendingUp,
      color: 'text-emerald-700',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
      highlight: true,
    },
  ]

  const statusProgress = [
    { key: 'Pending', label: 'Pending', count: ordersByStatus.Pending || 0, barColor: 'bg-amber-500' },
    { key: 'Confirmed', label: 'Confirmed', count: ordersByStatus.Confirmed || 0, barColor: 'bg-blue-500' },
    { key: 'Preparing', label: 'Preparing', count: ordersByStatus.Preparing || 0, barColor: 'bg-purple-500' },
    { key: 'Shipped', label: 'Shipped', count: ordersByStatus.Shipped || 0, barColor: 'bg-indigo-500' },
    { key: 'Completed', label: 'Completed', count: ordersByStatus.Completed || 0, barColor: 'bg-emerald-500' },
    { key: 'Cancelled', label: 'Cancelled', count: ordersByStatus.Cancelled || 0, barColor: 'bg-rose-500' },
  ]

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Admin Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Real-time e-commerce operational metrics and order fulfillment overview.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchDashboard(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 shadow-2xs transition hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh Metrics
          </button>
          <Link
            to="/admin/orders"
            className="inline-flex items-center gap-1.5 rounded-lg bg-black px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-gray-800"
          >
            View All Orders
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* 6 Core Metrics Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        {statsCards.map((card, idx) => {
          const Icon = card.icon
          const content = (
            <div
              key={idx}
              className={`relative overflow-hidden rounded-xl border bg-white p-5 shadow-2xs transition hover:shadow-xs ${card.borderColor}`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                    {card.title}
                  </p>
                  <p className="mt-2 text-2xl font-bold tracking-tight text-gray-900">
                    {card.value}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">{card.subtext}</p>
                </div>
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${card.bgColor} ${card.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>

              {card.badge && (
                <div className="mt-3">
                  <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold ${card.badgeColor}`}>
                    {card.badge}
                  </span>
                </div>
              )}
            </div>
          )

          return card.link ? (
            <Link key={idx} to={card.link} className="block transition hover:scale-[1.01]">
              {content}
            </Link>
          ) : (
            <div key={idx}>{content}</div>
          )
        })}
      </div>

      {/* Secondary Analytics: Orders by Status & Low Stock Alerts */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 mb-8">
        {/* Order Status Breakdown */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-2xs lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-bold text-gray-900">Order Status Breakdown</h2>
              <p className="text-xs text-gray-500 mt-0.5">Distribution across the order fulfillment lifecycle</p>
            </div>
            <Link
              to="/admin/orders"
              className="text-xs font-medium text-blue-600 hover:text-blue-800 transition"
            >
              Manage Orders &rarr;
            </Link>
          </div>

          <div className="space-y-4">
            {statusProgress.map((item) => {
              const percentage = totalOrders > 0 ? Math.round((item.count / totalOrders) * 100) : 0
              return (
                <div key={item.key} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-gray-700">{item.label}</span>
                    <span className="text-gray-500">
                      {item.count} orders ({percentage}%)
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                    <div
                      className={`h-full ${item.barColor} transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <h2 className="text-base font-bold text-gray-900">Low Stock Alerts</h2>
            </div>
            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
              {lowStockAlerts.length}
            </span>
          </div>
          <p className="text-xs text-gray-500 mb-4">Active products with 5 or fewer units remaining</p>

          {lowStockAlerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center text-gray-400">
              <CheckCircle2 className="h-8 w-8 text-emerald-500 mb-2" />
              <p className="text-xs font-medium text-gray-600">All inventory levels are healthy</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {lowStockAlerts.map((product) => (
                <div key={product.id} className="py-2.5 flex items-center justify-between">
                  <div className="pr-3">
                    <p className="text-xs font-semibold text-gray-900 line-clamp-1">{product.name}</p>
                    <p className="text-[11px] text-gray-400">{product.category_name}</p>
                  </div>
                  <span
                    className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-bold ${
                      product.stock === 0
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {product.stock === 0 ? 'Out of stock' : `${product.stock} left`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Orders Section */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-2xs overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900">Recent Orders</h2>
            <p className="text-xs text-gray-500">Latest customer transactions</p>
          </div>
          <Link
            to="/admin/orders"
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition"
          >
            View All ({totalOrders}) &rarr;
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="p-8 text-center text-xs text-gray-400">No orders placed yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/75 border-b border-gray-100 text-gray-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-6 py-3">Order Number</th>
                  <th className="px-6 py-3">Customer</th>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Total</th>
                  <th className="px-6 py-3">Payment</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50/50 transition">
                    <td className="px-6 py-3.5 font-semibold text-gray-900 font-mono">
                      {order.order_number}
                    </td>
                    <td className="px-6 py-3.5">
                      <p className="font-medium text-gray-900">{order.customer_name}</p>
                      <p className="text-[11px] text-gray-400">{order.customer_email}</p>
                    </td>
                    <td className="px-6 py-3.5 text-gray-500 whitespace-nowrap">
                      {new Date(order.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-6 py-3.5 font-semibold text-gray-900">
                      {formatCurrency(order.total)}
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-700">
                        {order.payment_method}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                          order.status === 'Completed'
                            ? 'bg-emerald-50 text-emerald-700'
                            : order.status === 'Cancelled'
                            ? 'bg-rose-50 text-rose-700'
                            : order.status === 'Pending'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-blue-50 text-blue-700'
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <Link
                        to={`/admin/orders/${order.id}`}
                        className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-800"
                      >
                        Details &rarr;
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

