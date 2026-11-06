import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, AlertCircle } from 'lucide-react'
import { useCart } from '../../context/CartContext'
import { api } from '../../services/api'

function Checkout() {
  const { cart, cartTotal, clearCart, showToast } = useCart()

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

  const formatPrice = (price) =>
    Number(price).toLocaleString('en-PH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })

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

  async function handleSubmit(e) {
    e.preventDefault()

    const validationErrors = validateForm()
    setErrors(validationErrors)

    if (Object.keys(validationErrors).length > 0) {
      return
    }

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
        clearCart()
        showToast?.('Order placed successfully!', 'success')
        setCompletedOrder(response.data)
      } else {
        throw new Error(response?.message || 'Failed to place order.')
      }
    } catch (err) {
      setSubmitError(err.message || 'Something went wrong while placing your order.')
      showToast?.(err.message || 'Failed to place order.', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (completedOrder) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-16 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <CheckCircle2 className="h-10 w-10" />
        </div>

        <h1 className="text-3xl font-bold">Thank You for Your Order!</h1>
        <p className="mt-2 text-gray-600">
          Your order has been recorded in our database.
        </p>

        <div className="mt-8 space-y-4 rounded-xl border border-gray-200 bg-gray-50 p-6 text-left">
          <div className="flex justify-between border-b border-gray-200 pb-3 text-sm">
            <span className="text-gray-500">Order Number</span>
            <span className="font-mono font-bold text-black">
              {completedOrder.order_number}
            </span>
          </div>

          <div className="flex justify-between border-b border-gray-200 pb-3 text-sm">
            <span className="text-gray-500">Customer Name</span>
            <span className="font-medium text-black">
              {completedOrder.customer_name}
            </span>
          </div>

          <div className="flex justify-between pt-1 text-base font-semibold">
            <span>Total Amount</span>
            <span className="font-bold text-black">
              ₱{formatPrice(completedOrder.total)}
            </span>
          </div>
        </div>

        <div className="mt-8 flex justify-center">
          <Link
            to="/products"
            className="rounded-lg bg-black px-6 py-3 font-medium text-white transition hover:bg-gray-800"
          >
            Continue Shopping
          </Link>
        </div>
      </main>
    )
  }

  if (cart.length === 0) {
    return (
      <main className="mx-auto max-w-7xl px-6 py-16 text-center">
        <h1 className="text-3xl font-bold">Your cart is empty</h1>

        <p className="mt-4 text-gray-500">
          Add products before proceeding to checkout.
        </p>

        <Link
          to="/products"
          className="mt-6 inline-block rounded-lg bg-black px-6 py-3 text-white hover:bg-gray-800"
        >
          Browse Products
        </Link>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <h1 className="mb-8 text-3xl font-bold">Checkout</h1>

      {submitError && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="text-sm font-medium">{submitError}</p>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 gap-10 lg:grid-cols-3"
      >
        {/* Customer Information */}
        <section className="space-y-6 lg:col-span-2">
          <div className="rounded-xl border border-gray-200 p-6">
            <h2 className="mb-6 text-xl font-bold">
              Customer Information
            </h2>

            <div className="space-y-5">
              {/* Full Name */}
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Full Name *
                </label>

                <input
                  type="text"
                  name="customer_name"
                  value={formData.customer_name}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
                  placeholder="Enter your full name"
                  disabled={isSubmitting}
                />

                {errors.customer_name && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.customer_name}
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Email Address *
                </label>

                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
                  placeholder="example@email.com"
                  disabled={isSubmitting}
                />

                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Contact Number */}
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Contact Number *
                </label>

                <input
                  type="tel"
                  name="contact_number"
                  value={formData.contact_number}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
                  placeholder="09XXXXXXXXX"
                  disabled={isSubmitting}
                />

                {errors.contact_number && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.contact_number}
                  </p>
                )}
              </div>

              {/* Delivery Address */}
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Delivery Address *
                </label>

                <textarea
                  name="delivery_address"
                  value={formData.delivery_address}
                  onChange={handleChange}
                  rows="3"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
                  placeholder="Enter your complete delivery address"
                  disabled={isSubmitting}
                />

                {errors.delivery_address && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.delivery_address}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="rounded-xl border border-gray-200 p-6">
            <h2 className="mb-6 text-xl font-bold">Payment Method</h2>

            <div className="space-y-4">
              {[
                { value: 'COD', label: 'Cash on Delivery' },
                { value: 'E_WALLET', label: 'E-wallet' },
                { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
              ].map((method) => (
                <label
                  key={method.value}
                  className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 p-4 hover:bg-gray-50"
                >
                  <input
                    type="radio"
                    name="payment_method"
                    value={method.value}
                    checked={formData.payment_method === method.value}
                    onChange={handleChange}
                    disabled={isSubmitting}
                  />

                  <span className="text-sm font-medium">
                    {method.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Order Notes */}
          <div className="rounded-xl border border-gray-200 p-6">
            <h2 className="mb-4 text-xl font-bold">Order Notes</h2>

            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="3"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
              placeholder="Optional instructions for your order"
              disabled={isSubmitting}
            />
          </div>
        </section>

        {/* Order Summary */}
        <aside className="h-fit rounded-xl border border-gray-200 p-6">
          <h2 className="text-xl font-bold">Order Summary</h2>

          <div className="mt-6 space-y-4">
            {cart.map((item) => (
              <div key={item.id} className="flex justify-between gap-4 text-sm">
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-gray-500">
                    Quantity: {item.quantity}
                  </p>
                </div>

                <p className="font-medium">
                  ₱{formatPrice(item.price * item.quantity)}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-between border-t border-gray-200 pt-4">
            <span className="font-semibold">Total</span>
            <span className="text-xl font-bold">
              ₱{formatPrice(cartTotal)}
            </span>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-6 w-full rounded-lg bg-black px-4 py-3 font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            {isSubmitting ? 'Placing Order...' : 'Place Order'}
          </button>

          <Link
            to="/cart"
            className="mt-4 block text-center text-sm text-gray-500 hover:text-black"
          >
            Back to Cart
          </Link>
        </aside>
      </form>
    </main>
  )
}

export default Checkout
