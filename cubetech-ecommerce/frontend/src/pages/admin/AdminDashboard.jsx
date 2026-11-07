import { useEffect, useState, useMemo } from 'react'
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
  ChevronRight,
  CreditCard,
  Wallet,
  Building2,
  DollarSign,
  BarChart3,
  Calendar,
  AlertCircle,
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
  const [activeChartTab, setActiveChartTab] = useState('daily') // 'daily' | 'payment'

  const fetchDashboard = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true)
    else setLoading(true)
    setError(null)

    try {
      const response = await api.get('/admin/dashboard')
      if (response && response.success) {
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

  // Safely extract summary and metrics
  const summary = data?.summary || {}
  const totalProducts = data?.total_products ?? summary.total_products ?? 0
  const totalOrders = data?.total_orders ?? summary.total_orders ?? 0
  const pendingOrders = data?.pending_orders ?? summary.pending_orders ?? 0
  const completedOrders = data?.completed_orders ?? summary.completed_orders ?? 0
  const uniqueCustomers = data?.unique_customers ?? summary.unique_customers ?? 0
  const completedOrderSales = Number(data?.completed_order_sales ?? data?.completed_sales ?? summary.completed_order_sales ?? 0)
  const totalRevenue = Number(summary.total_revenue ?? completedOrderSales)
  const ordersByStatus = data?.orders_by_status || {}
  const lowStockAlerts = data?.low_stock_alerts || []
  const recentOrders = data?.recent_orders || []
  const topSellingProducts = data?.top_selling_products || []
  const dailySales = data?.daily_sales || []
  const salesByPayment = data?.sales_by_payment || []

  // Calculated Business Metrics
  const avgOrderValue = completedOrders > 0 ? completedOrderSales / completedOrders : 0
  const completionRate = totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0

  // Find max daily sales for bar chart normalization
  const maxDailyRevenue = useMemo(() => {
    if (!dailySales || dailySales.length === 0) return 1000
    const max = Math.max(...dailySales.map((d) => Math.max(d.revenue || 0, d.completed_sales || 0)))
    return max > 0 ? max : 1000
  }, [dailySales])

  // 1. Loading Skeleton State
  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="space-y-2">
            <div className="h-7 w-48 bg-gray-200 rounded-md" />
            <div className="h-4 w-72 bg-gray-200 rounded-md" />
          </div>
          <div className="h-9 w-32 bg-gray-200 rounded-lg" />
        </div>

        {/* 6 Stat Cards Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-28 rounded-xl border border-gray-200 bg-white p-4 space-y-3">
              <div className="flex justify-between items-center">
                <div className="h-3 w-16 bg-gray-200 rounded" />
                <div className="h-8 w-8 bg-gray-100 rounded-lg" />
              </div>
              <div className="h-6 w-24 bg-gray-200 rounded" />
              <div className="h-3 w-20 bg-gray-100 rounded" />
            </div>
          ))}
        </div>

        {/* Visualizations Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 h-80 rounded-xl border border-gray-200 bg-white p-6" />
          <div className="h-80 rounded-xl border border-gray-200 bg-white p-6" />
        </div>

        {/* Table Skeleton */}
        <div className="h-64 rounded-xl border border-gray-200 bg-white p-6" />
      </div>
    )
  }

  // 2. Error State with Retry
  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-8 text-center text-rose-900 shadow-xs">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 mb-4">
            <AlertCircle className="h-6 w-6 text-rose-600" />
          </div>
          <h2 className="text-lg font-bold">Failed to Load Dashboard Metrics</h2>
          <p className="mt-1 text-sm text-rose-700 max-w-md mx-auto">{error}</p>
          <div className="mt-6 flex justify-center gap-3">
            <button
              onClick={() => fetchDashboard(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-rose-700 transition"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Retry Connection
            </button>
            <Link
              to="/admin/orders"
              className="inline-flex items-center gap-2 rounded-lg border border-rose-200 bg-white px-4 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 transition"
            >
              Go to Orders
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // 3. Statistic Cards Definition
  const statCards = [
    {
      title: 'Total Products',
      value: totalProducts,
      subtext: `${summary.active_products ?? totalProducts} active in catalog`,
      icon: Package,
      iconColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-100',
    },
    {
      title: 'Total Orders',
      value: totalOrders,
      subtext: 'Lifetime orders placed',
      icon: ShoppingBag,
      iconColor: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-100',
      link: '/admin/orders',
    },
    {
      title: 'Pending Orders',
      value: pendingOrders,
      subtext: pendingOrders > 0 ? 'Action required' : 'All caught up',
      icon: Clock,
      iconColor: pendingOrders > 0 ? 'text-amber-600' : 'text-gray-400',
      bgColor: pendingOrders > 0 ? 'bg-amber-50' : 'bg-gray-50',
      borderColor: pendingOrders > 0 ? 'border-amber-200' : 'border-gray-200',
      badge: pendingOrders > 0 ? 'Review Needed' : null,
      badgeColor: 'bg-amber-100 text-amber-800',
      link: '/admin/orders?status=Pending',
    },
    {
      title: 'Completed Orders',
      value: completedOrders,
      subtext: `${completionRate}% fulfillment rate`,
      icon: CheckCircle2,
      iconColor: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-100',
      link: '/admin/orders?status=Completed',
    },
    {
      title: 'Unique Customers',
      value: uniqueCustomers,
      subtext: 'Distinct customer reach',
      icon: Users,
      iconColor: 'text-violet-600',
      bgColor: 'bg-violet-50',
      borderColor: 'border-violet-100',
    },
    {
      title: 'Completed-Order Sales',
      value: formatCurrency(completedOrderSales),
      subtext: `AOV: ${formatCurrency(avgOrderValue)}`,
      icon: TrendingUp,
      iconColor: 'text-emerald-700',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
      highlight: true,
    },
  ]

  // Status progress list for fulfillment progression
  const statusProgress = [
    { key: 'Pending', label: 'Pending', count: ordersByStatus.Pending || 0, barColor: 'bg-amber-500' },
    { key: 'Confirmed', label: 'Confirmed', count: ordersByStatus.Confirmed || 0, barColor: 'bg-blue-500' },
    { key: 'Preparing', label: 'Preparing', count: ordersByStatus.Preparing || 0, barColor: 'bg-purple-500' },
    { key: 'Shipped', label: 'Shipped', count: ordersByStatus.Shipped || 0, barColor: 'bg-indigo-500' },
    { key: 'Completed', label: 'Completed', count: ordersByStatus.Completed || 0, barColor: 'bg-emerald-500' },
    { key: 'Cancelled', label: 'Cancelled', count: ordersByStatus.Cancelled || 0, barColor: 'bg-rose-500' },
  ]

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Header & Refresh Action */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Executive Dashboard</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Real-time e-commerce operational metrics, sales visualization, and fulfillment overview.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchDashboard(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 shadow-2xs transition hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
            <span>Refresh</span>
          </button>
          <Link
            to="/admin/orders"
            className="inline-flex items-center gap-1.5 rounded-lg bg-black px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-gray-800"
          >
            <span>Fulfill Orders</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* 4. Statistic Cards Grid (Responsive 1 -> 2 -> 3 -> 6 cols) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        {statCards.map((card, idx) => {
          const Icon = card.icon
          const cardContent = (
            <div
              className={`h-full rounded-xl border bg-white p-4 shadow-2xs transition hover:shadow-xs flex flex-col justify-between ${
                card.borderColor
              } ${card.highlight ? 'ring-1 ring-emerald-500/20' : ''}`}
            >
              <div className="flex items-start justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 line-clamp-1">
                  {card.title}
                </span>
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${card.bgColor} ${card.iconColor}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>

              <div className="mt-3">
                <p className="text-xl font-bold tracking-tight text-gray-900 truncate">
                  {card.value}
                </p>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-[11px] text-gray-500 truncate">{card.subtext}</span>
                  {card.badge && (
                    <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[9px] font-bold ${card.badgeColor}`}>
                      {card.badge}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )

          return card.link ? (
            <Link key={idx} to={card.link} className="block transition hover:scale-[1.01]">
              {cardContent}
            </Link>
          ) : (
            <div key={idx}>{cardContent}</div>
          )
        })}
      </div>

      {/* 5. Sales Visualization Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Left: 7-Day Revenue & Sales Chart */}
        <div className="lg:col-span-2 rounded-xl border border-gray-200 bg-white p-6 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-gray-100">
              <div>
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-emerald-600" />
                  <h2 className="text-base font-bold text-gray-900">Sales & Revenue Visualization</h2>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  7-day transaction distribution and completed revenue trajectory
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveChartTab('daily')}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                    activeChartTab === 'daily'
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Daily Revenue
                </button>
                <button
                  onClick={() => setActiveChartTab('payment')}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                    activeChartTab === 'payment'
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Payment Distribution
                </button>
              </div>
            </div>

            {/* Chart Area */}
            {activeChartTab === 'daily' ? (
              <div className="mt-6">
                {dailySales.length === 0 ? (
                  <div className="py-16 text-center text-xs text-gray-400">
                    No recent sales records for visualization.
                  </div>
                ) : (
                  <div>
                    {/* SVG/CSS Bar Chart with dual metrics (Total Volume vs Completed Sales) */}
                    <div className="flex items-end justify-between gap-2 sm:gap-4 h-48 pt-6 px-2">
                      {dailySales.map((item, i) => {
                        const totalPct = Math.min(100, Math.round(((item.revenue || 0) / maxDailyRevenue) * 100))
                        const completedPct = Math.min(100, Math.round(((item.completed_sales || 0) / maxDailyRevenue) * 100))

                        return (
                          <div key={i} className="flex-1 flex flex-col items-center h-full justify-end group">
                            {/* Value tooltip on hover */}
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity mb-2 text-center pointer-events-none">
                              <span className="rounded-md bg-gray-900 px-2 py-1 text-[10px] font-semibold text-white shadow-xs whitespace-nowrap">
                                {formatCurrency(item.revenue)} ({item.order_count} orders)
                              </span>
                            </div>

                            {/* Bar container */}
                            <div className="w-full max-w-[42px] h-36 bg-gray-100 rounded-t-lg flex items-end justify-center relative overflow-hidden">
                              {/* Total Sales Bar (light emerald/blue) */}
                              <div
                                className="w-full bg-emerald-200 rounded-t-lg transition-all duration-500 absolute bottom-0"
                                style={{ height: `${Math.max(totalPct, 6)}%` }}
                              />
                              {/* Completed Sales Bar (solid emerald) */}
                              <div
                                className="w-full bg-emerald-600 rounded-t-lg transition-all duration-500 absolute bottom-0 z-10"
                                style={{ height: `${Math.max(completedPct, completedPct > 0 ? 6 : 0)}%` }}
                              />
                            </div>

                            {/* Day label */}
                            <span className="mt-2 text-[11px] font-semibold text-gray-600">
                              {item.day}
                            </span>
                            <span className="text-[9px] text-gray-400">
                              {item.date ? item.date.slice(5) : ''}
                            </span>
                          </div>
                        )
                      })}
                    </div>

                    {/* Chart Legend */}
                    <div className="mt-6 flex flex-wrap items-center justify-between border-t border-gray-100 pt-3 text-xs text-gray-500">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5">
                          <div className="h-3 w-3 rounded-xs bg-emerald-600" />
                          <span>Completed Order Sales</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="h-3 w-3 rounded-xs bg-emerald-200" />
                          <span>Total Order Volume</span>
                        </div>
                      </div>
                      <span className="font-semibold text-gray-700">
                        Total 7-day sales: {formatCurrency(dailySales.reduce((acc, d) => acc + (d.revenue || 0), 0))}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Payment Method Distribution Tab */
              <div className="mt-6 space-y-4">
                {salesByPayment.length === 0 ? (
                  <div className="py-16 text-center text-xs text-gray-400">
                    No payment transaction records.
                  </div>
                ) : (
                  salesByPayment.map((p, idx) => {
                    const totalAmt = salesByPayment.reduce((acc, cur) => acc + Number(cur.total_amount || 0), 0)
                    const pct = totalAmt > 0 ? Math.round((Number(p.total_amount) / totalAmt) * 100) : 0

                    return (
                      <div key={idx} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-medium">
                          <div className="flex items-center gap-2">
                            {p.payment_method === 'COD' && <DollarSign className="h-4 w-4 text-emerald-600" />}
                            {p.payment_method === 'E-Wallet' && <Wallet className="h-4 w-4 text-blue-600" />}
                            {p.payment_method === 'Bank Transfer' && <Building2 className="h-4 w-4 text-purple-600" />}
                            <span className="font-semibold text-gray-800">{p.payment_method}</span>
                            <span className="text-gray-400">({p.count} orders)</span>
                          </div>
                          <span className="font-bold text-gray-900">
                            {formatCurrency(p.total_amount)} ({pct}%)
                          </span>
                        </div>
                        <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
                          <div
                            className={`h-full transition-all duration-500 ${
                              p.payment_method === 'COD'
                                ? 'bg-emerald-500'
                                : p.payment_method === 'E-Wallet'
                                ? 'bg-blue-500'
                                : 'bg-purple-500'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: Order Status Progression & Low Stock Alerts */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-900">Fulfillment Funnel</h2>
              <Link to="/admin/orders" className="text-xs font-semibold text-blue-600 hover:text-blue-800">
                View &rarr;
              </Link>
            </div>

            <div className="mt-4 space-y-3.5">
              {statusProgress.map((item) => {
                const percentage = totalOrders > 0 ? Math.round((item.count / totalOrders) * 100) : 0
                return (
                  <div key={item.key} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-medium">
                      <span className="text-gray-700">{item.label}</span>
                      <span className="text-gray-500">
                        {item.count} ({percentage}%)
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
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

          {/* Quick Low Stock Indicator at bottom */}
          <div className="mt-6 border-t border-gray-100 pt-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-900">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                <span>Low Inventory ({lowStockAlerts.length})</span>
              </div>
              <Link to="/products" target="_blank" className="text-[11px] text-gray-400 hover:text-gray-600">
                Catalog &rarr;
              </Link>
            </div>
            {lowStockAlerts.length === 0 ? (
              <p className="text-[11px] text-emerald-600 font-medium">Stock levels healthy</p>
            ) : (
              <div className="space-y-1.5 max-h-24 overflow-y-auto">
                {lowStockAlerts.slice(0, 3).map((p) => (
                  <div key={p.id} className="flex items-center justify-between text-[11px]">
                    <span className="text-gray-700 truncate pr-2">{p.name}</span>
                    <span className="font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded">
                      {p.stock} left
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 6. Recent Orders Section (Responsive table with scroll & actions) */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-2xs overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-gray-900">Recent Customer Orders</h2>
            <p className="text-xs text-gray-500">Showing the latest orders submitted across the platform</p>
          </div>
          <Link
            to="/admin/orders"
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 transition"
          >
            <span>View All ({totalOrders}) Orders</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="py-12 text-center text-xs text-gray-400">
            No customer orders placed yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[640px]">
              <thead className="bg-gray-50/75 border-b border-gray-100 text-gray-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-6 py-3.5">Order Number</th>
                  <th className="px-6 py-3.5">Customer</th>
                  <th className="px-6 py-3.5">Date</th>
                  <th className="px-6 py-3.5">Total Amount</th>
                  <th className="px-6 py-3.5">Payment</th>
                  <th className="px-6 py-3.5">Fulfillment Status</th>
                  <th className="px-6 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50/50 transition">
                    <td className="px-6 py-3.5 font-semibold text-gray-900 font-mono">
                      <Link to={`/admin/orders/${order.id}`} className="hover:underline text-blue-600">
                        {order.order_number}
                      </Link>
                    </td>
                    <td className="px-6 py-3.5">
                      <p className="font-semibold text-gray-900">{order.customer_name}</p>
                      <p className="text-[11px] text-gray-400">{order.customer_email}</p>
                    </td>
                    <td className="px-6 py-3.5 text-gray-500 whitespace-nowrap">
                      {new Date(order.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-6 py-3.5 font-bold text-gray-900">
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
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : order.status === 'Cancelled'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : order.status === 'Pending'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
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
                        Manage &rarr;
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
