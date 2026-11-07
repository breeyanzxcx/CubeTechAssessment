import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, AlertCircle, RefreshCw, AlertTriangle, ArrowRight, ShoppingBag, ShieldCheck } from 'lucide-react'
import { useCart } from '../../context/CartContext'
import { api } from '../../services/api'
import EmptyState from '../../components/common/EmptyState'
import ConfirmDialog from '../../components/common/ConfirmDialog'

function Checkout() {
  const { cart, cartTotal, clearCart, syncCart, showToast } = useCart()

  const [formData, setFormData] = useState({
    customer_name: '',
    email: '',
    contact_number: '',
    delivery_address: '',
    payment_method: 'COD',
    notes: '',
  })

  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [completedOrder, setCompletedOrder] = useState(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)

  // Price & Availability Review State
  const [reviewData, setReviewData] = useState(null)
  const [isReviewing, setIsReviewing] = useState(false)

  const formatPrice = (price) =>
    Number(price).toLocaleString('en-PH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })

  // Review cart with server for price or stock changes
  const runReview = async () => {
    if (cart.length === 0) return
    setIsReviewing(true)
    try {
      const response = await api.post('/orders/review', {
        items: cart.map((i) => ({
          id: i.id,
          product_id: i.id,
          price: i.price,
          quantity: i.quantity,
        })),
      })

      if (response && response.success) {
        setReviewData(response)
      }
    } catch (err) {
      console.warn('Cart review notice:', err)
    } finally {
      setIsReviewing(false)
    }
  }

  useEffect(() => {
    runReview()
  }, [])

  function handleChange(e) {
    const { name, value } = e.target

    setFormData((current) => ({
      ...current,
      [name]: value,
    }))

    setErrors((current) => ({
      ...current,
      [name]: '',
    }))
  }

  function validateForm() {
    const newErrors = {}

    if (!formData.customer_name.trim()) {
      newErrors.customer_name = 'Full name is required.'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Enter a valid email address.'
    }

    if (!formData.contact_number.trim()) {
      newErrors.contact_number = 'Contact number is required.'
    }

    if (!formData.delivery_address.trim()) {
      newErrors.delivery_address = 'Delivery address is required.'
    }

    return newErrors
  }

  // Handle accepting updated prices / stock adjustments
  const handleAcceptChanges = () => {
    if (reviewData && reviewData.verified_items) {
      syncCart(reviewData.verified_items)
      setReviewData((prev) => ({
        ...prev,
        has_changes: false,
        changes: [],
        can_proceed: true,
      }))
      showToast('Cart updated with latest prices and stock.', 'success')
    }
  }

  function handleSubmit(e) {
    e.preventDefault()

    const validationErrors = validateForm()
    setErrors(validationErrors)

    if (Object.keys(validationErrors).length > 0) {
      return
    }

    // If there are unaccepted price or availability changes, prompt customer
    if (reviewData && reviewData.has_changes) {
      setSubmitError('Please review and accept the item price/availability updates before placing your order.')
      return
    }

    setShowConfirmModal(true)
  }

  async function executePlaceOrder() {
    setShowConfirmModal(false)
    setIsSubmitting(true)
    setSubmitError('')

    try {
      const payload = {
        customer_name: formData.customer_name.trim(),
        email: formData.email.trim(),
        contact_number: formData.contact_number.trim(),
        delivery_address: formData.delivery_address.trim(),
        payment_method: formData.payment_method,
        notes: formData.notes.trim() || null,
        items: cart.map((item) => ({
          product_id: item.id,
          quantity: item.quantity,
        })),
      }

      const response = await api.post('/orders', payload)

      if (response && response.success) {
        // Cart is cleared ONLY upon successful order creation
        clearCart()
        showToast?.('Order placed successfully!', 'success')
        setCompletedOrder(response.data)
      } else {
        throw new Error(response?.message || 'Failed to place order.')
      }
    } catch (err) {
      // NOTE: Failed checkout preserves cart completely (clearCart is NOT called here)
      setSubmitError(err.message || 'Something went wrong while placing your order.')
      showToast?.(err.message || 'Failed to place order.', 'error')
      // Re-review to catch live stock or price issues
      runReview()
    } finally {
      setIsSubmitting(false)
    }
  }

  if (completedOrder) {
    return (
      <main className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-12 sm:py-20 font-sans">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <CheckCircle2 className="h-10 w-10" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight text-center">
          Thank You for Your Order!
        </h1>
        <p className="mt-2 text-sm text-gray-600 text-center">
          Your order has been recorded in our database and is being processed for dispatch.
        </p>

        <div className="mt-8 space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-2xs">
          <div className="flex justify-between border-b border-gray-100 pb-3 text-sm">
            <span className="text-gray-500">Order Number</span>
            <span className="font-mono font-bold text-gray-900">
              {completedOrder.order_number}
            </span>
          </div>

          <div className="flex justify-between border-b border-gray-100 pb-3 text-sm">
            <span className="text-gray-500">Customer Name</span>
            <span className="font-semibold text-gray-900">
              {completedOrder.customer_name}
            </span>
          </div>

          <div className="flex justify-between border-b border-gray-100 pb-3 text-sm">
            <span className="text-gray-500">Payment Method</span>
            <span className="font-semibold text-gray-900">
              {completedOrder.payment_method === 'COD' ? 'Cash on Delivery' : 'GCash'}
            </span>
          </div>

          <div className="flex justify-between pt-1 text-base font-semibold">
            <span className="text-gray-900">Total Amount</span>
            <span className="font-black text-gray-900 text-xl">
              ₱{formatPrice(completedOrder.total)}
            </span>
          </div>
        </div>

        <div className="mt-8 flex justify-center">
          <Link
            to="/products"
            className="rounded-xl bg-black px-7 py-3 text-sm font-bold text-white transition hover:bg-gray-800 shadow-2xs"
          >
            Continue Shopping
          </Link>
        </div>
      </main>
    )
  }

  if (cart.length === 0) {
    return (
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <EmptyState
          icon={ShoppingBag}
          title="Your Shopping Cart is Empty"
          description="Add items to your cart before proceeding to checkout."
          actionLabel="Browse Products"
          actionTo="/products"
        />
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12 text-left font-sans">
      <h1 className="mb-8 text-3xl font-black tracking-tight text-gray-900">
        Checkout
      </h1>

      {/* PRICE / AVAILABILITY REVIEW BANNER */}
      {reviewData && reviewData.has_changes && (
        <div className="mb-8 rounded-2xl border border-amber-300 bg-amber-50/70 p-6 shadow-xs animate-in fade-in">
          <div className="flex items-start gap-3.5">
            <AlertTriangle className="h-6 w-6 shrink-0 text-amber-600 mt-0.5" />
            <div className="flex-1 space-y-3">
              <div>
                <h3 className="text-base font-bold text-amber-950">
                  Cart Review: Price & Inventory Updates Detected
                </h3>
                <p className="text-xs text-amber-800 mt-0.5">
                  Some items in your cart had price or stock changes since you added them. Please review the changes below:
                </p>
              </div>

              <div className="rounded-xl border border-amber-200 bg-white/90 divide-y divide-amber-100 overflow-hidden text-xs">
                {reviewData.changes?.map((change, idx) => (
                  <div key={idx} className="p-3.5 flex items-center justify-between gap-4">
                    <div>
                      <strong className="text-gray-900 font-semibold">{change.name}</strong>
                      <p className="text-amber-800 mt-0.5">{change.message}</p>
                    </div>

                    <span className="shrink-0 rounded-md bg-amber-100 px-2 py-1 text-[11px] font-bold text-amber-900 uppercase tracking-wider">
                      {change.type.replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                <span className="text-xs text-amber-900 font-medium">
                  {reviewData.can_proceed
                    ? 'Click below to accept these updates and continue.'
                    : 'Some items are unavailable or out of stock. Updating your cart will remove or adjust them.'}
                </span>

                <button
                  type="button"
                  onClick={handleAcceptChanges}
                  className="rounded-xl bg-amber-800 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-amber-900 transition flex items-center gap-1.5"
                >
                  <span>Accept & Update Cart</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Global Checkout Error */}
      {submitError && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-700">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
          <span>{submitError}</span>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 gap-10 lg:grid-cols-3"
      >
        {/* Customer Information & Shipping Form */}
        <section className="space-y-6 lg:col-span-2">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-2xs">
            <h2 className="mb-6 text-lg font-bold text-gray-900">
              Delivery Information
            </h2>

            <div className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="customer_name"
                  value={formData.customer_name}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm outline-none focus:border-black transition"
                  placeholder="Enter recipient's full name"
                  disabled={isSubmitting}
                />
                {errors.customer_name && (
                  <p className="mt-1 text-xs text-red-600">{errors.customer_name}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm outline-none focus:border-black transition"
                  placeholder="example@email.com"
                  disabled={isSubmitting}
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-red-600">{errors.email}</p>
                )}
              </div>

              {/* Contact Number */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Contact Number *
                </label>
                <input
                  type="tel"
                  name="contact_number"
                  value={formData.contact_number}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm outline-none focus:border-black transition"
                  placeholder="09XXXXXXXXX"
                  disabled={isSubmitting}
                />
                {errors.contact_number && (
                  <p className="mt-1 text-xs text-red-600">{errors.contact_number}</p>
                )}
              </div>

              {/* Delivery Address */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Complete Delivery Address *
                </label>
                <textarea
                  name="delivery_address"
                  value={formData.delivery_address}
                  onChange={handleChange}
                  rows="3"
                  className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm outline-none focus:border-black transition"
                  placeholder="House/Unit #, Street, Barangay, City, Province, Postal Code"
                  disabled={isSubmitting}
                />
                {errors.delivery_address && (
                  <p className="mt-1 text-xs text-red-600">{errors.delivery_address}</p>
                )}
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-2xs">
            <h2 className="mb-6 text-lg font-bold text-gray-900">
              Payment Method
            </h2>

            <div className="space-y-3">
              {[
                { value: 'COD', label: 'Cash on Delivery (COD)' },
                { value: 'E_WALLET', label: 'E-Wallet (GCash / Maya)' },
                { value: 'BANK_TRANSFER', label: 'Direct Bank Transfer' },
              ].map((method) => (
                <label
                  key={method.value}
                  className={`flex cursor-pointer items-center gap-3.5 rounded-xl border p-4 transition ${
                    formData.payment_method === method.value
                      ? 'border-black bg-gray-50/70 font-semibold'
                      : 'border-gray-200 hover:bg-gray-50/50'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment_method"
                    value={method.value}
                    checked={formData.payment_method === method.value}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    className="accent-black"
                  />
                  <span className="text-sm text-gray-900">{method.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Order Notes */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-2xs">
            <h2 className="mb-3 text-lg font-bold text-gray-900">
              Order Notes (Optional)
            </h2>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="2"
              className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm outline-none focus:border-black transition"
              placeholder="e.g. Landmark, special delivery instructions"
              disabled={isSubmitting}
            />
          </div>
        </section>

        {/* Order Summary Aside */}
        <aside className="h-fit rounded-2xl border border-gray-200 bg-white p-6 shadow-2xs space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Order Summary</h2>
            {isReviewing && (
              <span className="flex items-center gap-1 text-[11px] text-gray-400">
                <RefreshCw className="h-3 w-3 animate-spin" />
                <span>Checking prices...</span>
              </span>
            )}
          </div>

          {/* Items Preview */}
          <div className="space-y-3 divide-y divide-gray-100 text-xs">
            {cart.map((item) => (
              <div key={item.id} className="pt-3 first:pt-0 flex justify-between gap-4">
                <div>
                  <p className="font-semibold text-gray-900">{item.name}</p>
                  <p className="text-gray-500 mt-0.5">
                    Qty: {item.quantity} × ₱{formatPrice(item.price)}
                  </p>
                </div>
                <p className="font-bold text-gray-900 whitespace-nowrap">
                  ₱{formatPrice(item.price * item.quantity)}
                </p>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="border-t border-gray-200 pt-4 space-y-2 text-xs">
            <div className="flex justify-between text-gray-500">
              <span>Subtotal</span>
              <span>₱{formatPrice(cartTotal)}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>Shipping Fee</span>
              <span className="font-medium text-emerald-600">Calculated upon delivery</span>
            </div>
            <div className="flex justify-between border-t border-gray-200 pt-3 text-base font-black text-gray-900">
              <span>Total</span>
              <span>₱{formatPrice(cartTotal)}</span>
            </div>
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            disabled={isSubmitting || (reviewData && !reviewData.can_proceed)}
            className="w-full rounded-xl bg-black px-4 py-3 text-sm font-bold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-400 shadow-xs"
          >
            {isSubmitting
              ? 'Placing Order...'
              : reviewData && reviewData.has_changes
              ? 'Review Changes Above to Continue'
              : 'Place Order'}
          </button>

          <Link
            to="/cart"
            className="block text-center text-xs font-semibold text-gray-500 hover:text-black transition"
          >
            Back to Cart
          </Link>
        </aside>
      </form>

      {/* Order Placement Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showConfirmModal}
        title="Confirm Your Order"
        message={`Are you ready to submit this order of ${cart.length} item(s) totaling ₱${formatPrice(cartTotal)}? Payment method: ${formData.payment_method === 'COD' ? 'Cash on Delivery' : 'GCash'} to be delivered to "${formData.delivery_address}".`}
        confirmLabel="Confirm & Place Order"
        cancelLabel="Review Information"
        variant="primary"
        isLoading={isSubmitting}
        onConfirm={executePlaceOrder}
        onCancel={() => setShowConfirmModal(false)}
      />
    </main>
  )
}

export default Checkout
