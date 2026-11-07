import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { api } from '../../services/api'
import ErrorMessage from '../../components/common/ErrorMessage'

const STATUS_STYLES = {
  Pending:   'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  Confirmed: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
  Preparing: 'bg-purple-50 text-purple-700 ring-1 ring-purple-200',
  Shipped:   'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200',
  Completed: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  Cancelled: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
}

function DetailSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-6 w-48 rounded bg-gray-100" />
      <div className="rounded-2xl border border-gray-200 p-6 space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-4 rounded bg-gray-100" style={{ width: `${60 + i * 7}%` }} />
        ))}
      </div>
      <div className="rounded-2xl border border-gray-200 p-6 space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-4 rounded bg-gray-100" style={{ width: `${80 - i * 10}%` }} />
        ))}
      </div>
    </div>
  )
}

export default function MyOrderDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchOrder = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get(`/orders/${id}`)
      setOrder(res.data)
      document.title = `Order #${res.data.order_number} | CubeTech`
    } catch (err) {
      if (err.message?.includes('not found') || err.message?.includes('404')) {
        navigate('/orders', { replace: true })
      } else {
        setError(err.message || 'Failed to load order details.')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrder()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString('en-PH', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })

  const formatPrice = (val) =>
    Number(val).toLocaleString('en-PH', { style: 'currency', currency: 'PHP' })

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      {/* Back link */}
      <Link
        to="/orders"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-black transition"
      >
        Back to My Orders
      </Link>

      {loading && (
        <div className="mt-6">
          <DetailSkeleton />
        </div>
      )}

      {error && !loading && (
        <div className="mt-6">
          <ErrorMessage message={error} onRetry={fetchOrder} />
        </div>
      )}

      {!loading && !error && order && (
        <div className="mt-4 space-y-6">
          {/* Order Header */}
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-gray-900">
                Order #{order.order_number}
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Placed on {formatDate(order.created_at)}
              </p>
            </div>
            <span
              className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${STATUS_STYLES[order.status] ?? 'bg-gray-100 text-gray-600'}`}
            >
              {order.status}
            </span>
          </div>

          {/* Customer & Delivery Info */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-2xs">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-gray-500">
              Delivery Information
            </h2>
            <dl className="grid grid-cols-1 gap-y-3 sm:grid-cols-2 text-sm">
              <div>
                <dt className="font-semibold text-gray-700">Name</dt>
                <dd className="text-gray-600">{order.customer_name}</dd>
              </div>
              <div>
                <dt className="font-semibold text-gray-700">Email</dt>
                <dd className="text-gray-600">{order.customer_email}</dd>
              </div>
              <div>
                <dt className="font-semibold text-gray-700">Contact</dt>
                <dd className="text-gray-600">{order.customer_contact || '—'}</dd>
              </div>
              <div>
                <dt className="font-semibold text-gray-700">Payment Method</dt>
                <dd className="text-gray-600">{order.payment_method}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="font-semibold text-gray-700">Delivery Address</dt>
                <dd className="text-gray-600">{order.delivery_address}</dd>
              </div>
              {order.notes && (
                <div className="sm:col-span-2">
                  <dt className="font-semibold text-gray-700">Notes</dt>
                  <dd className="text-gray-600">{order.notes}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Order Items */}
          <div className="rounded-2xl border border-gray-200 bg-white shadow-2xs overflow-hidden">
            <div className="border-b border-gray-100 px-6 py-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500">
                Items Ordered
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <th className="px-5 py-3 text-left">Product</th>
                    <th className="px-5 py-3 text-right">Unit Price</th>
                    <th className="px-5 py-3 text-right">Qty</th>
                    <th className="px-5 py-3 text-right">Line Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(order.items ?? []).map((item) => (
                    <tr key={item.id} className="border-b border-gray-100 last:border-0">
                      <td className="px-5 py-3 font-medium text-gray-800">
                        {item.product_name}
                      </td>
                      <td className="px-5 py-3 text-right text-gray-600">
                        {formatPrice(item.unit_price)}
                      </td>
                      <td className="px-5 py-3 text-right text-gray-600">
                        {item.quantity}
                      </td>
                      <td className="px-5 py-3 text-right font-semibold text-gray-800">
                        {formatPrice(item.line_total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="border-t border-gray-100 px-5 py-4 space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between font-bold text-gray-900 text-base">
                <span>Total</span>
                <span>{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

