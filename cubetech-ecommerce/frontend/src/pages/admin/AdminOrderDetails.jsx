import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Clock,
  Package,
  Truck,
  RotateCcw,
  RefreshCw,
  X,
} from 'lucide-react'
import { api } from '../../services/api'

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

function AdminOrderDetails() {
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [feedback, setFeedback] = useState(null)
  const [showCancelDialog, setShowCancelDialog] = useState(false)

  const formatPrice = (price) =>
    Number(price).toLocaleString('en-PH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })

  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  async function fetchOrder() {
    setLoading(true)
    setError('')
    try {
      const response = await api.get(`/admin/orders/${id}`)
      if (response && response.success) {
        setOrder(response.data)
      } else {
        throw new Error(response?.message || 'Order not found.')
      }
    } catch (err) {
      setError(err.message || 'Error loading order details.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrder()
  }, [id])

  useEffect(() => {
    if (order && order.order_number) {
      document.title = `Order #${order.order_number} | CubeTech Admin`
    }
  }, [order])

  async function handleUpdateStatus(newStatus) {
    if (!order) return
    setActionLoading(true)
    setFeedback(null)

    try {
      const response = await api.put(`/admin/orders/${order.id}/status`, {
        status: newStatus,
      })

      if (response && response.success) {
        setFeedback({
          type: 'success',
          message: response.message || `Status updated to ${newStatus}.`,
        })
        setOrder((curr) => ({ ...curr, status: newStatus }))
      } else {
        throw new Error(response?.message || 'Failed to update order status.')
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Error updating order status.',
      })
    } finally {
      setActionLoading(false)
    }
  }

  async function handleCancelOrder() {
    if (!order) return
    setActionLoading(true)
    setFeedback(null)

    try {
      const response = await api.post(`/admin/orders/${order.id}/cancel`)

      if (response && response.success) {
        setFeedback({
          type: 'success',
          message:
            response.message ||
            `Order #${order.order_number} cancelled and product stock restored.`,
        })
        setOrder((curr) => ({ ...curr, status: 'Cancelled' }))
      } else {
        throw new Error(response?.message || 'Failed to cancel order.')
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Error cancelling order.',
      })
    } finally {
      setActionLoading(false)
      setShowCancelDialog(false)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-20 text-center">
        <RefreshCw className="mx-auto h-8 w-8 animate-spin text-gray-400" />
        <p className="mt-3 text-sm text-gray-500">Loading order #{id}...</p>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-16 text-center">
        <AlertCircle className="mx-auto h-10 w-10 text-red-500" />
        <h2 className="mt-3 text-lg font-bold text-gray-900">Unable to load order</h2>
        <p className="mt-1 text-sm text-gray-500">{error || 'Order not found.'}</p>
        <Link
          to="/admin/orders"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-xs font-semibold text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to All Orders</span>
        </Link>
      </div>
    )
  }

  const cfg = STATUS_CONFIG[order.status] || {}

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      {/* Top Breadcrumb & Action bar */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Link
          to="/admin/orders"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-black transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Orders List</span>
        </Link>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-start">
          {cfg.nextStatus && (
            <button
              onClick={() => handleUpdateStatus(cfg.nextStatus)}
              disabled={actionLoading}
              className="rounded-lg bg-black px-4 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-gray-800 disabled:bg-gray-300"
            >
              {actionLoading ? 'Updating...' : cfg.nextActionLabel}
            </button>
          )}

          {cfg.canCancel && (
            <button
              onClick={() => setShowCancelDialog(true)}
              disabled={actionLoading}
              className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2 text-xs font-semibold text-red-600 hover:bg-red-100 disabled:opacity-50"
            >
              Cancel Order
            </button>
          )}
        </div>
      </div>

      {/* Feedback banner */}
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

      {/* Main Order Card */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-xs overflow-hidden">
        {/* Header Section */}
        <div className="border-b border-gray-200 p-6 bg-gray-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-black text-gray-900 font-mono tracking-tight">
                #{order.order_number}
              </h2>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${
                  cfg.badgeClass || 'bg-gray-100 text-gray-700'
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${cfg.dotClass || 'bg-gray-400'}`}
                />
                {order.status}
              </span>
            </div>
            <p className="mt-1 text-xs text-gray-400">
              Placed on {formatDate(order.created_at)}
            </p>
          </div>

          <div className="text-right">
            <span className="block text-xs uppercase tracking-wider text-gray-400 font-semibold">
              Total Amount
            </span>
            <span className="text-2xl font-black text-gray-900">
              ₱{formatPrice(order.total)}
            </span>
          </div>
        </div>

        {/* Customer & Shipping Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 border-b border-gray-200 text-xs">
          <div className="space-y-2">
            <h3 className="font-bold uppercase tracking-wider text-[11px] text-gray-400">
              Customer Information
            </h3>
            <p><span className="text-gray-500">Full Name:</span> <strong className="text-gray-800 text-sm">{order.customer_name}</strong></p>
            <p><span className="text-gray-500">Email:</span> <span className="text-gray-800">{order.customer_email}</span></p>
            <p><span className="text-gray-500">Contact:</span> <span className="text-gray-800">{order.customer_contact}</span></p>
          </div>

          <div className="space-y-2">
            <h3 className="font-bold uppercase tracking-wider text-[11px] text-gray-400">
              Delivery & Payment Details
            </h3>
            <p><span className="text-gray-500">Payment Method:</span> <strong className="text-gray-800">{order.payment_method}</strong></p>
            <p><span className="text-gray-500">Delivery Address:</span> <span className="text-gray-800">{order.delivery_address}</span></p>
            {order.notes && (
              <p><span className="text-gray-500">Order Notes:</span> <span className="text-gray-700 italic">"{order.notes}"</span></p>
            )}
          </div>
        </div>

        {/* Items List */}
        <div className="p-6">
          <h3 className="font-bold text-gray-900 text-sm mb-4">
            Order Items ({order.items?.length || 0})
          </h3>

          <div className="rounded-xl border border-gray-200 overflow-hidden divide-y divide-gray-100 text-xs">
            {order.items?.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-4 bg-white hover:bg-gray-50/50">
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">{item.product_name}</h4>
                  <p className="text-gray-400 text-xs mt-0.5">
                    Unit Price: ₱{formatPrice(item.unit_price)} × {item.quantity} unit(s)
                  </p>
                </div>
                <div className="font-bold text-sm text-gray-900">
                  ₱{formatPrice(item.line_total)}
                </div>
              </div>
            ))}
          </div>

          {/* Pricing Totals */}
          <div className="mt-6 flex justify-end">
            <div className="w-full max-w-xs rounded-xl bg-gray-50 p-4 space-y-2 text-xs border border-gray-200">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>₱{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-2 text-sm font-black text-gray-900">
                <span>Total</span>
                <span>₱{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CANCEL CONFIRMATION DIALOG */}
      {showCancelDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                <RotateCcw className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  Cancel Order #{order.order_number}?
                </h3>
                <p className="text-xs text-gray-500">
                  This action cannot be undone.
                </p>
              </div>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed rounded-lg bg-gray-50 p-3 border border-gray-200">
              Cancelling this order will mark it as <strong>Cancelled</strong> and automatically <strong>restore all item quantities</strong> back to product inventory in MySQL.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowCancelDialog(false)}
                disabled={actionLoading}
                className="rounded-lg border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                Keep Order
              </button>

              <button
                onClick={handleCancelOrder}
                disabled={actionLoading}
                className="rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {actionLoading ? 'Restoring Stock...' : 'Confirm & Restore Stock'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminOrderDetails

