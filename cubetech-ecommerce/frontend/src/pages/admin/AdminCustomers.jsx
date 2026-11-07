import { Link } from 'react-router-dom'
import { useEffect, useState, useMemo } from 'react'
import {
  Users,
  Search,
  RefreshCw,
  ShoppingBag,
  TrendingUp,
  DollarSign,
  ShieldCheck,
  Eye,
  Calendar,
  Phone,
  Mail,
  MapPin,
  ArrowRight,
  ChevronRight,
  ExternalLink,
  X,
  FileText,
  Clock,
  Package,
  AlertCircle,
} from 'lucide-react'

import { api } from '../../services/api'
function formatPrice(amount) {
  const num = Number(amount) || 0
  return `₱${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatDate(dateStr) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatDateTime(dateStr) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function AdminCustomers() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [refreshing, setRefreshing] = useState(false)

  // Filters & sorting
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('completed_value') // 'completed_value', 'order_count', 'recent', 'name'

  // Selected customer for read-only order history drawer
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [customerOrders, setCustomerOrders] = useState([])
  const [ordersLoading, setOrdersLoading] = useState(false)

  const fetchCustomers = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    setError(null)

    try {
      const res = await api.get('/admin/customers')
      if (res && res.success) {
        setCustomers(res.data || [])
      } else {
        setError(res?.message || 'Failed to fetch customer directory.')
      }
    } catch (err) {
      setError(err.message || 'Error connecting to customer service.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchCustomers()
  }, [])

  // Open read-only customer order history drawer
  const handleViewCustomerOrders = async (customer) => {
    setSelectedCustomer(customer)
    setCustomerOrders([])
    setOrdersLoading(true)

    try {
      const res = await api.get(`/admin/customers/${encodeURIComponent(customer.email)}/orders`)
      if (res && res.success) {
        setCustomerOrders(res.data || [])
      }
    } catch (err) {
      console.error('Failed to load customer orders:', err)
    } finally {
      setOrdersLoading(false)
    }
  }

  // Filtered and sorted customers
  const processedCustomers = useMemo(() => {
    let list = customers.filter((c) => {
      const q = search.trim().toLowerCase()
      if (!q) return true
      return (
        c.customer_name?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.customer_contact?.toLowerCase().includes(q) ||
        c.delivery_address?.toLowerCase().includes(q)
      )
    })

    return list.sort((a, b) => {
      if (sortBy === 'completed_value') {
        return (b.completed_order_value || 0) - (a.completed_order_value || 0)
      }
      if (sortBy === 'order_count') {
        return (b.order_count || 0) - (a.order_count || 0)
      }
      if (sortBy === 'recent') {
        const dateA = new Date(a.last_order_date || 0).getTime()
        const dateB = new Date(b.last_order_date || 0).getTime()
        return dateB - dateA
      }
      if (sortBy === 'name') {
        return (a.customer_name || '').localeCompare(b.customer_name || '')
      }
      return 0
    })
  }, [customers, search, sortBy])

  // Aggregate stats
  const stats = useMemo(() => {
    const totalCustomers = customers.length
    const totalOrders = customers.reduce((sum, c) => sum + (c.order_count || 0), 0)
    const totalCompletedValue = customers.reduce((sum, c) => sum + (c.completed_order_value || 0), 0)
    const avgCustomerValue = totalCustomers > 0 ? totalCompletedValue / totalCustomers : 0
    return { totalCustomers, totalOrders, totalCompletedValue, avgCustomerValue }
  }, [customers])

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Customer Directory</h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-semibold text-gray-700">
              <ShieldCheck className="h-3 w-3 text-emerald-600" />
              <span>Read-Only Ledger</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Aggregated customer profiles derived from historical orders, normalized emails, and lifetime completed sales.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchCustomers(true)}
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
            <span>All Orders</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-2xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Unique Customers</span>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalCustomers}</p>
          <span className="text-xs text-gray-500">Normalized email accounts</span>
        </div>

        <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-4 shadow-2xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-600">Total Orders Placed</span>
          <p className="text-2xl font-bold text-indigo-700 mt-1">{stats.totalOrders}</p>
          <span className="text-xs text-indigo-600/80">Across all customers</span>
        </div>

        <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-4 shadow-2xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600">Lifetime Completed Value</span>
          <p className="text-2xl font-bold text-emerald-700 mt-1">{formatPrice(stats.totalCompletedValue)}</p>
          <span className="text-xs text-emerald-600/80">Completed order sales</span>
        </div>

        <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4 shadow-2xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Avg. Customer Value</span>
          <p className="text-2xl font-bold text-gray-700 mt-1">{formatPrice(stats.avgCustomerValue)}</p>
          <span className="text-xs text-gray-400">Completed spend per customer</span>
        </div>
      </div>

      {/* Search & Sort Controls Toolbar */}
      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by customer name, email, or contact number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-gray-50/50 pl-9 pr-8 py-2 text-xs focus:border-black focus:bg-white focus:outline-hidden transition"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-500 whitespace-nowrap">Sort By:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 focus:border-black focus:outline-hidden transition"
          >
            <option value="completed_value">Highest Completed Sales</option>
            <option value="order_count">Most Orders Placed</option>
            <option value="recent">Most Recent Order</option>
            <option value="name">Customer Name (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Main Customers Table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-2xs overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-500">
            <RefreshCw className="h-8 w-8 animate-spin text-gray-400 mb-3" />
            <p className="text-sm font-medium">Loading customer ledger...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-700 bg-rose-50/50">
            <AlertCircle className="h-8 w-8 mx-auto text-rose-500 mb-2" />
            <p className="font-semibold text-sm">{error}</p>
            <button
              onClick={() => fetchCustomers(true)}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700"
            >
              <RefreshCw className="h-3 w-3" /> Retry
            </button>
          </div>
        ) : processedCustomers.length === 0 ? (
          <div className="py-20 text-center text-gray-500">
            <Users className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-base font-bold text-gray-700">No customers found</p>
            <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
              {search
                ? 'No customers match your search criteria.'
                : 'Customer records will appear here automatically when customer orders are placed.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[760px]">
              <thead className="bg-gray-50/75 border-b border-gray-100 text-gray-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-6 py-3.5">Customer Name</th>
                  <th className="px-6 py-3.5">Contact Details</th>
                  <th className="px-6 py-3.5">Order Count</th>
                  <th className="px-6 py-3.5">Completed-Order Value</th>
                  <th className="px-6 py-3.5">Last Order Date</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {processedCustomers.map((customer) => {
                  const initial = customer.customer_name ? customer.customer_name.charAt(0).toUpperCase() : 'C'

                  return (
                    <tr key={customer.email} className="hover:bg-gray-50/50 transition">
                      {/* Customer Name & Avatar */}
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-900 text-white font-bold text-xs uppercase shadow-2xs">
                            {initial}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 text-xs">
                              {customer.customer_name}
                            </p>
                            <span className="text-[10px] text-gray-400">
                              First ordered on {formatDate(customer.first_order_date)}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Contact Info (Normalized Email & Phone) */}
                      <td className="px-6 py-3.5">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 font-mono text-gray-800 text-[11px]">
                            <Mail className="h-3 w-3 text-gray-400 shrink-0" />
                            <span>{customer.email}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-gray-500 text-[11px]">
                            <Phone className="h-3 w-3 text-gray-400 shrink-0" />
                            <span>{customer.customer_contact || 'N/A'}</span>
                          </div>
                        </div>
                      </td>

                      {/* Order Count */}
                      <td className="px-6 py-3.5 whitespace-nowrap">
                        <Link
                          to={`/admin/orders?search=${encodeURIComponent(customer.email)}`}
                          title="View customer orders"
                          className="inline-flex items-center gap-1.5 rounded-md bg-gray-100 hover:bg-gray-200 px-2.5 py-1 text-[11px] font-bold text-gray-800 transition"
                        >
                          <ShoppingBag className="h-3 w-3 text-gray-500" />
                          <span>{customer.order_count} order{customer.order_count !== 1 ? 's' : ''}</span>
                        </Link>
                      </td>

                      {/* Completed-Order Value */}
                      <td className="px-6 py-3.5 whitespace-nowrap">
                        <div>
                          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                            <TrendingUp className="h-3 w-3 text-emerald-600" />
                            <span>{formatPrice(customer.completed_order_value)}</span>
                          </span>
                          <span className="block text-[10px] text-gray-400 mt-0.5">
                            {customer.completed_orders_count || 0} completed
                          </span>
                        </div>
                      </td>

                      {/* Last Order Date */}
                      <td className="px-6 py-3.5 whitespace-nowrap text-gray-600">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3 w-3 text-gray-400" />
                          <span>{formatDate(customer.last_order_date)}</span>
                        </div>
                      </td>

                      {/* Actions: Read-Only Order History Inspection */}
                      <td className="px-6 py-3.5 whitespace-nowrap text-right">
                        <button
                          onClick={() => handleViewCustomerOrders(customer)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-gray-700 hover:bg-gray-50 hover:text-black hover:border-gray-300 shadow-2xs transition"
                        >
                          <FileText className="h-3.5 w-3.5 text-gray-400" />
                          <span>History</span>
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Read-Only Disclaimer Note */}
      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-4 text-xs text-gray-500 flex items-start gap-3 shadow-2xs">
        <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-gray-900">Audited Customer Records (Read-Only)</p>
          <p className="mt-0.5 text-gray-500">
            Customer directory entries are automatically aggregated from submitted orders. Email addresses are normalized to prevent duplicate accounts, and the latest name and contact numbers are preserved. These records are read-only to maintain transaction auditability and historical data integrity.
          </p>
        </div>
      </div>

      {/* =========================================================================
          READ-ONLY CUSTOMER ORDER HISTORY DRAWER / MODAL
      ========================================================================= */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-gray-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setSelectedCustomer(null)}
          />

          <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl bg-white shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 bg-gray-50/60">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black text-white font-bold text-sm">
                  {selectedCustomer.customer_name ? selectedCustomer.customer_name.charAt(0).toUpperCase() : 'C'}
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    {selectedCustomer.customer_name}
                  </h3>
                  <p className="text-xs text-gray-500 font-mono">
                    {selectedCustomer.email} &bull; {selectedCustomer.customer_contact || 'No contact'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedCustomer(null)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Customer Summary Bar */}
            <div className="grid grid-cols-3 gap-2 px-6 py-3 bg-gray-50 border-b border-gray-100 text-xs">
              <div>
                <span className="text-[10px] uppercase font-semibold text-gray-400">Total Orders</span>
                <p className="font-bold text-gray-900">{selectedCustomer.order_count}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-semibold text-gray-400">Completed Sales</span>
                <p className="font-bold text-emerald-700">{formatPrice(selectedCustomer.completed_order_value)}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-semibold text-gray-400">Latest Delivery Address</span>
                <p className="font-medium text-gray-700 line-clamp-1">{selectedCustomer.delivery_address || 'N/A'}</p>
              </div>
            </div>

            {/* Orders History List (Read-Only) */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Transaction History ({customerOrders.length})
              </h4>

              {ordersLoading ? (
                <div className="py-12 text-center text-gray-400">
                  <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-gray-300" />
                  <p className="text-xs">Loading customer orders...</p>
                </div>
              ) : customerOrders.length === 0 ? (
                <div className="py-8 text-center text-xs text-gray-400">
                  No order transactions found for this customer.
                </div>
              ) : (
                <div className="space-y-3">
                  {customerOrders.map((order) => (
                    <div
                      key={order.id}
                      className="rounded-xl border border-gray-200 bg-white p-4 shadow-2xs hover:border-gray-300 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/admin/orders/${order.id}`}
                            className="font-mono text-xs font-bold text-blue-600 hover:underline"
                          >
                            {order.order_number}
                          </Link>
                          <span
                            className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold ${order.status === 'Completed'
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
                        </div>

                        <p className="text-[11px] text-gray-400 flex items-center gap-2">
                          <span>{formatDateTime(order.created_at)}</span>
                          <span>&bull;</span>
                          <span>Payment: {order.payment_method}</span>
                          <span>&bull;</span>
                          <span>{order.total_items ?? 1} item(s)</span>
                        </p>

                        {order.delivery_address && (
                          <p className="text-[11px] text-gray-500 line-clamp-1">
                            Address: {order.delivery_address}
                          </p>
                        )}
                      </div>

                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                        <span className="text-sm font-bold text-gray-900">
                          {formatPrice(order.total)}
                        </span>
                        <Link
                          to={`/admin/orders/${order.id}`}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800"
                        >
                          <span>Manage Order</span>
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-100 px-6 py-3 bg-gray-50 flex items-center justify-between text-xs">
              <span className="text-gray-400">Read-only transaction ledger</span>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="rounded-lg bg-black px-4 py-1.5 text-xs font-semibold text-white hover:bg-gray-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

