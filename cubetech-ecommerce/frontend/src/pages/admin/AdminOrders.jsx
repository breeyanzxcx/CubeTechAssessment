import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Package,
  Truck,
  XCircle,
  AlertCircle,
  Eye,
  RefreshCw,
  RotateCcw,
  X,
  ChevronRight,
  ExternalLink,
} from 'lucide-react'
import { api } from '../../services/api'

// Status progression configuration matching backend
const STATUS_CONFIG = {
  Pending: {
    label: 'Pending',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    dotClass: 'bg-amber-500',
    nextStatus: 'Confirmed',
    nextActionLabel: 'Confirm Order',
    canCancel: true,
  },
  Confirmed: {
    label: 'Confirmed',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    dotClass: 'bg-blue-500',
    nextStatus: 'Preparing',
    nextActionLabel: 'Start Preparing',
    canCancel: true,
  },
  Preparing: {
    label: 'Preparing',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
    dotClass: 'bg-purple-500',
    nextStatus: 'Shipped',
    nextActionLabel: 'Mark as Shipped',
    canCancel: false,
  },
  Shipped: {
    label: 'Shipped',
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    dotClass: 'bg-indigo-500',
    nextStatus: 'Completed',
    nextActionLabel: 'Mark as Completed',
    canCancel: false,
  },
  Completed: {
    label: 'Completed',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dotClass: 'bg-emerald-500',
    nextStatus: null,
    nextActionLabel: null,
    canCancel: false,
  },
  Cancelled: {
    label: 'Cancelled',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
    dotClass: 'bg-rose-500',
    nextStatus: null,
    nextActionLabel: null,
    canCancel: false,
  },
}

function AdminOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')

  const [actionLoadingId, setActionLoadingId] = useState(null)
  const [feedback, setFeedback] = useState(null) // { type: 'success' | 'error', message: '' }

  // Modals
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [orderToCancel, setOrderToCancel] = useState(null)
  const [detailsLoading, setDetailsLoading] = useState(false)

  const formatPrice = (price) =>
    Number(price).toLocaleString('en-PH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })

  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  async function fetchOrders() {
    setLoading(true)
    setError('')
    try {
      const response = await api.get('/admin/orders')
      if (response && response.success) {
        setOrders(response.data || [])
      } else {
        throw new Error(response?.message || 'Failed to load orders.')
      }
    } catch (err) {
      setError(err.message || 'Error fetching orders from server.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  // Metrics
  const stats = useMemo(() => {
    const counts = {
      TOTAL: orders.length,
      Pending: 0,
      Confirmed: 0,
      Preparing: 0,
      Shipped: 0,
      Completed: 0,
      Cancelled: 0,
    }

    orders.forEach((o) => {
      if (counts[o.status] !== undefined) {
        counts[o.status] += 1
      }
    })

    return counts
  }, [orders])

  // Filtered orders
  const filteredOrders = useMemo(() => {
    const result = orders.filter((o) => {
      const matchesStatus =
        statusFilter === 'ALL' || o.status === statusFilter

      const q = search.trim().toLowerCase()
      const matchesSearch =
        !q ||
        o.order_number?.toLowerCase().includes(q) ||
        o.customer_name?.toLowerCase().includes(q) ||
        o.customer_email?.toLowerCase().includes(q) ||
        o.customer_contact?.toLowerCase().includes(q)

      return matchesStatus && matchesSearch
    })

    // Guarantee newest orders first (created_at DESC, id DESC)
    return [...result].sort((a, b) => {
      const dateA = new Date(a.created_at).getTime() || 0
      const dateB = new Date(b.created_at).getTime() || 0
      if (dateB !== dateA) return dateB - dateA
      return (b.id || 0) - (a.id || 0)
    })
  }, [orders, statusFilter, search])

  // Status update handler
  async function handleUpdateStatus(orderId, newStatus) {
    setActionLoadingId(orderId)
    setFeedback(null)

    try {
      const response = await api.put(`/admin/orders/${orderId}/status`, {
        status: newStatus,
      })

      if (response && response.success) {
        setFeedback({
          type: 'success',
          message: response.message || `Order updated to ${newStatus}.`,
        })

        // Update local state
        setOrders((prev) =>
          prev.map((o) =>
            o.id === orderId
              ? { ...o, status: newStatus, updated_at: new Date().toISOString() }
              : o
          )
        )

        // If modal is open for this order, update it too
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder((curr) => ({ ...curr, status: newStatus }))
        }
      } else {
        throw new Error(response?.message || 'Failed to update order status.')
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Error updating order status.',
      })
    } finally {
      setActionLoadingId(null)
    }
  }

  // Cancel order handler
  async function handleConfirmCancel() {
    if (!orderToCancel) return

    const orderId = orderToCancel.id
    setActionLoadingId(orderId)
    setFeedback(null)

    try {
      const response = await api.post(`/admin/orders/${orderId}/cancel`)

      if (response && response.success) {
        setFeedback({
          type: 'success',
          message:
            response.message ||
            `Order #${orderToCancel.order_number} cancelled and product stock restored.`,
        })

        // Update local state
        setOrders((prev) =>
          prev.map((o) =>
            o.id === orderId
              ? { ...o, status: 'Cancelled', updated_at: new Date().toISOString() }
              : o
          )
        )

        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder((curr) => ({ ...curr, status: 'Cancelled' }))
        }
      } else {
        throw new Error(response?.message || 'Failed to cancel order.')
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Error cancelling order.',
      })
    } finally {
      setActionLoadingId(null)
      setOrderToCancel(null)
    }
  }

  // View Details Modal loader
  async function handleOpenDetails(order) {
    setSelectedOrder(order)
    setDetailsLoading(true)

    try {
      const res = await api.get(`/admin/orders/${order.id}`)
      if (res && res.success) {
        setSelectedOrder(res.data)
      }
    } catch (err) {
      console.error('Failed to fetch detailed order items:', err)
    } finally {
      setDetailsLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      {/* Page Title & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Order Management
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Track, update status, and manage customer orders and inventory restoration.
          </p>
        </div>

        <button
          onClick={fetchOrders}
          disabled={loading}
          className="inline-flex items-center gap-2 self-start rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-2xs hover:bg-gray-50 hover:text-black transition"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Global Action Feedback Alert */}
      {feedback && (
        <aside
          className={`mb-6 flex items-center justify-between gap-3 rounded-xl border p-4 text-sm font-medium ${
            feedback.type === 'error'
              ? 'border-red-200 bg-red-50 text-red-700'
              : 'border-emerald-200 bg-emerald-50 text-emerald-800'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedback.type === 'error' ? (
              <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
            ) : (
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
            )}
            <span>{feedback.message}</span>
          </div>

          <button
            onClick={() => setFeedback(null)}
            className="rounded p-1 opacity-70 hover:opacity-100"
          >
            <X className="h-4 w-4" />
          </button>
        </aside>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 mb-8">
        {[
          { key: 'TOTAL', label: 'All Orders', count: stats.TOTAL, color: 'text-gray-900', bg: 'bg-white' },
          { key: 'Pending', label: 'Pending', count: stats.Pending, color: 'text-amber-700', bg: 'bg-amber-50/50' },
          { key: 'Confirmed', label: 'Confirmed', count: stats.Confirmed, color: 'text-blue-700', bg: 'bg-blue-50/50' },
          { key: 'Preparing', label: 'Preparing', count: stats.Preparing, color: 'text-purple-700', bg: 'bg-purple-50/50' },
          { key: 'Shipped', label: 'Shipped', count: stats.Shipped, color: 'text-indigo-700', bg: 'bg-indigo-50/50' },
          { key: 'Completed', label: 'Completed', count: stats.Completed, color: 'text-emerald-700', bg: 'bg-emerald-50/50' },
          { key: 'Cancelled', label: 'Cancelled', count: stats.Cancelled, color: 'text-rose-700', bg: 'bg-rose-50/50' },
        ].map((m) => (
          <button
            key={m.key}
            onClick={() => setStatusFilter(m.key)}
            className={`rounded-xl border p-4 text-left transition ${
              statusFilter === m.key
                ? 'border-black ring-1 ring-black bg-white shadow-xs'
                : 'border-gray-200 ' + m.bg + ' hover:border-gray-300'
            }`}
          >
            <span className="block text-xs font-semibold uppercase tracking-wider text-gray-500">
              {m.label}
            </span>
            <span className={`mt-1 block text-2xl font-black ${m.color}`}>
              {m.count}
            </span>
          </button>
        ))}
      </div>

      {/* Filters and Search Bar */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order #, customer name, email..."
            className="w-full rounded-lg border border-gray-200 bg-white pl-10 pr-4 py-2.5 text-sm outline-none focus:border-black shadow-2xs"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-gray-100 border border-gray-200 text-xs font-medium">
          {['ALL', 'Pending', 'Confirmed', 'Preparing', 'Shipped', 'Completed', 'Cancelled'].map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`rounded-lg px-3 py-1.5 transition ${
                statusFilter === tab
                  ? 'bg-white text-black font-semibold shadow-2xs'
                  : 'text-gray-600 hover:text-black hover:bg-gray-200/60'
              }`}
            >
              {tab === 'ALL' ? 'All' : tab}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table Container */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center">
            <RefreshCw className="mx-auto h-8 w-8 animate-spin text-gray-400" />
            <p className="mt-3 text-sm text-gray-500">Loading orders from database...</p>
          </div>
        ) : error ? (
          <div className="py-16 text-center text-red-600">
            <AlertCircle className="mx-auto h-8 w-8 text-red-500" />
            <p className="mt-2 font-medium">{error}</p>
            <button
              onClick={fetchOrders}
              className="mt-4 rounded-lg bg-black px-4 py-2 text-xs font-medium text-white"
            >
              Retry
            </button>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-20 text-center">
            <Package className="mx-auto h-10 w-10 text-gray-300" />
            <h3 className="mt-3 text-base font-semibold text-gray-800">No orders found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {search || statusFilter !== 'ALL'
                ? 'Try adjusting your search criteria or status filter.'
                : 'Customer orders placed on the store will show up here.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/75 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Order #</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Payment</th>
                  <th className="py-3.5 px-4">Total</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredOrders.map((order) => {
                  const cfg = STATUS_CONFIG[order.status] || {}
                  const isBusy = actionLoadingId === order.id

                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-gray-50/80 transition-colors"
                    >
                      {/* Order Number */}
                      <td className="py-3.5 px-4 font-mono font-semibold text-black">
                        <button
                          onClick={() => handleOpenDetails(order)}
                          className="hover:underline flex items-center gap-1.5 text-left"
                        >
                          <span>{order.order_number}</span>
                          <Eye className="h-3.5 w-3.5 text-gray-400" />
                        </button>
                        <span className="block text-xs font-sans font-normal text-gray-400 mt-0.5">
                          {order.total_items ?? 1} item(s)
                        </span>
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 text-xs text-gray-600 whitespace-nowrap">
                        {formatDate(order.created_at)}
                      </td>

                      {/* Customer Info */}
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-gray-900">{order.customer_name}</div>
                        <div className="text-xs text-gray-500 truncate max-w-xs">{order.customer_email}</div>
                        <div className="text-xs text-gray-400">{order.customer_contact}</div>
                      </td>

                      {/* Payment Method */}
                      <td className="py-3.5 px-4">
                        <span className="inline-block rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                          {order.payment_method}
                        </span>
                      </td>

                      {/* Total */}
                      <td className="py-3.5 px-4 font-bold text-gray-900 whitespace-nowrap">
                        ₱{formatPrice(order.total)}
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${
                            cfg.badgeClass || 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${cfg.dotClass || 'bg-gray-400'}`}
                          />
                          {order.status}
                        </span>
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          {/* Next Transition Button */}
                          {cfg.nextStatus && (
                            <button
                              onClick={() => handleUpdateStatus(order.id, cfg.nextStatus)}
                              disabled={isBusy}
                              className="rounded-lg bg-black px-3 py-1.5 text-xs font-medium text-white transition hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed shadow-2xs"
                            >
                              {isBusy ? 'Updating...' : cfg.nextActionLabel}
                            </button>
                          )}

                          {/* Cancel Order Button (Strictly for Pending & Confirmed) */}
                          {cfg.canCancel && (
                            <button
                              onClick={() => setOrderToCancel(order)}
                              disabled={isBusy}
                              className="rounded-lg border border-red-200 bg-red-50/50 px-2.5 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-100/70 hover:border-red-300 disabled:opacity-50"
                              title="Cancel order and restore stock"
                            >
                              Cancel
                            </button>
                          )}

                          {/* Details Modal Button */}
                          <button
                            onClick={() => handleOpenDetails(order)}
                            className="rounded-lg border border-gray-200 p-1.5 text-gray-500 hover:border-gray-300 hover:text-black hover:bg-gray-50"
                            title="Quick inspect order items"
                          >
                            <Eye className="h-4 w-4" />
                          </button>

                          {/* Dedicated Page Link */}
                          <Link
                            to={`/admin/orders/${order.id}`}
                            className="rounded-lg border border-gray-200 p-1.5 text-gray-500 hover:border-gray-300 hover:text-blue-600 hover:bg-blue-50"
                            title="Open full order details page"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ORDER DETAILS MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl border border-gray-200 bg-white shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 bg-gray-50/50">
              <div>
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <span>Order Details</span>
                  <span className="font-mono text-sm font-semibold text-gray-500">
                    #{selectedOrder.order_number}
                  </span>
                </h3>
                <span className="text-xs text-gray-400">
                  Placed on {formatDate(selectedOrder.created_at)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  to={`/admin/orders/${selectedOrder.id}`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-2xs hover:bg-gray-50 hover:text-black transition"
                >
                  <span>Open Full Page</span>
                  <ExternalLink className="h-3.5 w-3.5 text-gray-400" />
                </Link>

                <button
                  onClick={() => setSelectedOrder(null)}
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Status and Workflow Bar */}
              <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Current Status
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${
                      STATUS_CONFIG[selectedOrder.status]?.badgeClass || 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${
                        STATUS_CONFIG[selectedOrder.status]?.dotClass || 'bg-gray-400'
                      }`}
                    />
                    {selectedOrder.status}
                  </span>
                </div>

                {/* Status Next Action Controls inside Modal */}
                <div className="mt-4 pt-3 border-t border-gray-200 flex flex-wrap items-center justify-between gap-3">
                  <span className="text-xs text-gray-500">
                    {selectedOrder.status === 'Completed'
                      ? 'Order is completed and archived.'
                      : selectedOrder.status === 'Cancelled'
                      ? 'Order was cancelled; items returned to stock.'
                      : 'Allowed status actions for this order:'}
                  </span>

                  <div className="flex items-center gap-2">
                    {STATUS_CONFIG[selectedOrder.status]?.nextStatus && (
                      <button
                        onClick={() =>
                          handleUpdateStatus(
                            selectedOrder.id,
                            STATUS_CONFIG[selectedOrder.status].nextStatus
                          )
                        }
                        disabled={actionLoadingId === selectedOrder.id}
                        className="rounded-lg bg-black px-3 py-1.5 text-xs font-semibold text-white hover:bg-gray-800 disabled:bg-gray-300"
                      >
                        {actionLoadingId === selectedOrder.id
                          ? 'Updating...'
                          : `Advance to ${STATUS_CONFIG[selectedOrder.status].nextStatus}`}
                      </button>
                    )}

                    {STATUS_CONFIG[selectedOrder.status]?.canCancel && (
                      <button
                        onClick={() => setOrderToCancel(selectedOrder)}
                        disabled={actionLoadingId === selectedOrder.id}
                        className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100"
                      >
                        Cancel Order
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Customer & Delivery Information Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-xl border border-gray-200 p-4 space-y-2 text-xs">
                  <h4 className="font-bold text-gray-900 uppercase tracking-wider text-[11px]">
                    Customer Details
                  </h4>
                  <p><span className="text-gray-400">Name:</span> <strong className="text-gray-800">{selectedOrder.customer_name}</strong></p>
                  <p><span className="text-gray-400">Email:</span> <span className="text-gray-800">{selectedOrder.customer_email}</span></p>
                  <p><span className="text-gray-400">Phone:</span> <span className="text-gray-800">{selectedOrder.customer_contact}</span></p>
                </div>

                <div className="rounded-xl border border-gray-200 p-4 space-y-2 text-xs">
                  <h4 className="font-bold text-gray-900 uppercase tracking-wider text-[11px]">
                    Delivery & Payment
                  </h4>
                  <p><span className="text-gray-400">Payment:</span> <strong className="text-gray-800">{selectedOrder.payment_method}</strong></p>
                  <p><span className="text-gray-400">Address:</span> <span className="text-gray-800">{selectedOrder.delivery_address}</span></p>
                  {selectedOrder.notes && (
                    <p><span className="text-gray-400">Notes:</span> <span className="text-gray-700 italic">"{selectedOrder.notes}"</span></p>
                  )}
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h4 className="font-bold text-gray-900 text-sm mb-3">
                  Purchased Items ({selectedOrder.items?.length || 0})
                </h4>

                {detailsLoading ? (
                  <p className="text-xs text-gray-400 py-4 text-center">Loading item lines...</p>
                ) : selectedOrder.items?.length > 0 ? (
                  <div className="rounded-xl border border-gray-200 overflow-hidden divide-y divide-gray-100 text-xs">
                    {selectedOrder.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3">
                        <div>
                          <div className="font-semibold text-gray-900">{item.product_name}</div>
                          <div className="text-gray-400 text-[11px]">
                            ₱{formatPrice(item.unit_price)} × {item.quantity} unit(s)
                          </div>
                        </div>
                        <div className="font-bold text-gray-900">
                          ₱{formatPrice(item.line_total)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 italic">No item line details available.</p>
                )}
              </div>

              {/* Order Totals Summary */}
              <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4 space-y-2 text-xs">
                <div className="flex justify-between text-gray-500">
                  <span>Subtotal</span>
                  <span>₱{formatPrice(selectedOrder.subtotal)}</span>
                </div>
                <div className="flex justify-between border-t border-gray-200 pt-2 text-sm font-bold text-gray-900">
                  <span>Total Amount</span>
                  <span>₱{formatPrice(selectedOrder.total)}</span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-gray-200 px-6 py-3 bg-gray-50 flex justify-end">
              <button
                onClick={() => setSelectedOrder(null)}
                className="rounded-lg bg-gray-200 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CANCEL CONFIRMATION DIALOG */}
      {orderToCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                <RotateCcw className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  Cancel Order #{orderToCancel.order_number}?
                </h3>
                <p className="text-xs text-gray-500">
                  This action cannot be undone.
                </p>
              </div>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed rounded-lg bg-gray-50 p-3 border border-gray-200">
              Cancelling this order will mark it as <strong>Cancelled</strong> and automatically <strong>restore all item quantities</strong> back to product stock in the database.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setOrderToCancel(null)}
                disabled={actionLoadingId === orderToCancel.id}
                className="rounded-lg border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                Keep Order
              </button>

              <button
                onClick={handleConfirmCancel}
                disabled={actionLoadingId === orderToCancel.id}
                className="rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {actionLoadingId === orderToCancel.id ? 'Restoring Stock...' : 'Confirm & Restore Stock'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminOrders

