import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Trash2, ShoppingBag, ArrowRight, ArrowLeft, Plus, Minus, LogIn } from 'lucide-react'
import { useCart } from '../../context/CartContext'
import { useAuth } from '../../context/AuthContext'
import EmptyState from '../../components/common/EmptyState'
import ConfirmDialog from '../../components/common/ConfirmDialog'

function Cart() {
  const {
    cart,
    cartCount,
    cartTotal,
    updateQuantity,
    removeFromCart,
    clearCart,
  } = useCart()
  const { isAuthenticated } = useAuth()

  const [itemToRemove, setItemToRemove] = useState(null)
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  const formatPrice = (price) =>
    Number(price).toLocaleString('en-PH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })

  const handleConfirmRemove = () => {
    if (itemToRemove) {
      removeFromCart(itemToRemove.id)
      setItemToRemove(null)
    }
  }

  const handleConfirmClear = () => {
    clearCart(true)
    setShowClearConfirm(false)
  }

  if (!isAuthenticated) {
    return (
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-20 text-center">
        <EmptyState
          icon={LogIn}
          title="Sign in to View Your Cart"
          description="You must be signed in to your CubeTech account to add items to your cart and proceed to checkout."
          actionLabel="Sign In to Continue"
          actionTo="/login"
        />
      </main>
    )
  }

  if (cart.length === 0) {
    return (
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-20 text-center">
        <EmptyState
          icon={ShoppingBag}
          title="Your Shopping Cart is Empty"
          description="Looks like you haven't added any tech products to your cart yet. Explore our latest arrivals and hardware collection."
          actionLabel="Explore Products"
          actionTo="/products"
        />
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12 text-left">
      {/* Page Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-gray-100 pb-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-gray-900">
            Shopping Cart
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Review your selected gear before proceeding to checkout.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowClearConfirm(true)}
          className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline transition self-start sm:self-auto"
        >
          Clear Cart
        </button>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-12">
        {/* Cart Items List */}
        <section className="space-y-4 lg:col-span-2">
          {cart.map((item) => (
            <article
              key={item.id}
              className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-2xs sm:flex-row sm:items-center justify-between"
            >
              {/* Product Info & Thumbnail */}
              <div className="flex items-center gap-4">
                <Link to={`/products/${item.id}`} className="shrink-0">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="h-20 w-20 rounded-xl bg-gray-100 object-cover sm:h-24 sm:w-24"
                    />
                  ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-gray-100 text-xs text-gray-400 sm:h-24 sm:w-24">
                      No image
                    </div>
                  )}
                </Link>

                <div className="flex-1 min-w-0">
                  <Link
                    to={`/products/${item.id}`}
                    className="font-bold text-gray-900 text-sm sm:text-base hover:underline line-clamp-1"
                  >
                    {item.name}
                  </Link>

                  <p className="mt-1 text-xs sm:text-sm font-semibold text-gray-700">
                    ₱{formatPrice(item.price)} each
                  </p>

                  <p className="mt-0.5 text-[11px] text-gray-500">
                    {item.stock} in stock
                  </p>

                  <button
                    type="button"
                    onClick={() => setItemToRemove(item)}
                    className="mt-2.5 inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-800 transition"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>Remove</span>
                  </button>
                </div>
              </div>

              {/* Quantity Controls & Line Total */}
              <div className="flex items-center justify-between sm:justify-end gap-6 pt-2 sm:pt-0 border-t sm:border-0 border-gray-100">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                    aria-label={`Decrease quantity of ${item.name}`}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-30 transition"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>

                  <span className="min-w-8 text-center text-sm font-bold text-gray-900">
                    {item.quantity}
                  </span>

                  <button
                    type="button"
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    disabled={item.quantity >= item.stock}
                    aria-label={`Increase quantity of ${item.name}`}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-30 transition"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="text-right sm:w-28">
                  <p className="text-xs text-gray-400 sm:hidden">Total</p>
                  <p className="text-sm sm:text-base font-black text-gray-900">
                    ₱{formatPrice(item.price * item.quantity)}
                  </p>
                </div>
              </div>
            </article>
          ))}

          <div className="pt-2">
            <Link
              to="/products"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-black transition"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Continue Shopping</span>
            </Link>
          </div>
        </section>

        {/* Order Summary Sidebar */}
        <aside className="h-fit rounded-2xl border border-gray-200 bg-white p-6 shadow-2xs">
          <h2 className="text-lg font-bold text-gray-900 tracking-tight">Order Summary</h2>

          <div className="mt-5 space-y-3 border-b border-gray-100 pb-5 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Items Total ({cartCount} {cartCount === 1 ? 'item' : 'items'})</span>
              <span className="font-semibold text-gray-900">₱{formatPrice(cartTotal)}</span>
            </div>

            <div className="flex justify-between text-gray-600">
              <span>Shipping Fee</span>
              <span className="text-emerald-600 font-semibold">Free Delivery</span>
            </div>
          </div>

          <div className="mt-4 flex justify-between items-baseline">
            <span className="text-sm font-bold text-gray-900">Grand Total</span>
            <span className="text-2xl font-black text-gray-900">
              ₱{formatPrice(cartTotal)}
            </span>
          </div>

          <p className="mt-2 text-[11px] text-gray-500 leading-normal">
            Local taxes included. Cash on Delivery and GCash options available at checkout.
          </p>

          <Link
            to="/checkout"
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-black py-3 px-4 text-center text-sm font-semibold text-white shadow-2xs transition hover:bg-gray-800"
          >
            <span>Proceed to Checkout</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </aside>
      </div>

      {/* Remove Single Item Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(itemToRemove)}
        title="Remove Item from Cart"
        message={`Are you sure you want to remove "${itemToRemove?.name}" from your shopping cart?`}
        confirmLabel="Remove Item"
        cancelLabel="Keep in Cart"
        variant="danger"
        onConfirm={handleConfirmRemove}
        onCancel={() => setItemToRemove(null)}
      />

      {/* Clear Whole Cart Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showClearConfirm}
        title="Empty Shopping Cart"
        message="Are you sure you want to remove all items from your shopping cart? This cannot be undone."
        confirmLabel="Clear Cart"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleConfirmClear}
        onCancel={() => setShowClearConfirm(false)}
      />
    </main>
  )
}

export default Cart
