import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import ErrorMessage from '../../components/common/ErrorMessage'
import EmptyState from '../../components/common/EmptyState'

const STATUS_STYLES = {
  Pending:   'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  Confirmed: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
  Preparing: 'bg-purple-50 text-purple-700 ring-1 ring-purple-200',
  Shipped:   'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200',
  Completed: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  Cancelled: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
}

function OrderRowSkeleton() {
  return (
    <tr className="border-b border-gray-100 animate-pulse">
      {[...Array(6)].map((_, i) => (
        <td key={i} className="px-4 py-4">
          <div className="h-4 rounded bg-gray-100" style={{ width: i === 0 ? '70%' : i === 4 ? '50%' : '60%' }} />
        </td>
      ))}
    </tr>
  )
}

export default function MyOrders() {
  const { user } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchOrders = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get('/orders')
      setOrders(res.data ?? [])
    } catch (err) {
      setError(err.message || 'Failed to load orders.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    document.title = 'My Orders | CubeTech'
    fetchOrders()
  }, [])

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString('en-PH', {
      year: 'numeric', month: 'short', day: 'numeric',
    })

  const formatPrice = (val) =>
    Number(val).toLocaleString('en-PH', { style: 'currency', currency: 'PHP' })

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      {/* Page Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900">My Orders</h1>
          {user && (
            <p className="mt-1 text-sm text-gray-500">
              Orders placed by <span className="font-semibold text-gray-700">{user.email}</span>
            </p>
          )}
        </div>
        <button
          onClick={fetchOrders}
          disabled={loading}
          className="self-start sm:self-auto rounded-lg border border-gray-200 px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
        >
          {loading ? 'Refreshing...' : 'Refresh Orders'}
        </button>
      </div>

      {/* Error State */}
      {error && !loading && (
        <ErrorMessage
          message={error}
          onRetry={() => {
            setError(null)
            setLoading(true)
            api.get('/orders')
              .then((res) => setOrders(res.data ?? []))
              .catch((err) => setError(err.message || 'Failed to load orders.'))
              .finally(() => setLoading(false))
          }}
        />
      )}

      {/* Table */}
      {!error && (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <th className="px-4 py-3 text-left">Order</th>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Items</th>
                  <th className="px-4 py-3 text-left">Total</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-right">Details</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [...Array(4)].map((_, i) => <OrderRowSkeleton key={i} />)
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center">
                      <EmptyState
                        title="No orders yet"
                        message="When you place an order, it will appear here."
                        action={
                          <Link
                            to="/products"
                            className="inline-block rounded-xl bg-black px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 transition"
                          >
                            Browse Products
                          </Link>
                        }
                      />
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr
                      key={order.id}
                      className="border-b border-gray-100 hover:bg-gray-50/60 transition-colors"
                    >
                      <td className="px-4 py-4 font-mono font-semibold text-gray-800">
                        #{order.order_number}
                      </td>
                      <td className="px-4 py-4 text-gray-600">
                        {formatDate(order.created_at)}
                      </td>
                      <td className="px-4 py-4 text-gray-600">
                        {order.total_quantity} {Number(order.total_quantity) === 1 ? 'item' : 'items'}
                      </td>
                      <td className="px-4 py-4 font-semibold text-gray-800">
                        {formatPrice(order.total)}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[order.status] ?? 'bg-gray-100 text-gray-600'}`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <Link
                          to={`/orders/${order.id}`}
                          className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

