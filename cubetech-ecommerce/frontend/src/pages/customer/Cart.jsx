
import { Link } from 'react-router-dom'
import { useCart } from '../../context/CartContext'

function Cart() {
  const {
    cart,
    cartCount,
    cartTotal,
    updateQuantity,
    removeFromCart,
  } = useCart()

  const formatPrice = (price) =>
    Number(price).toLocaleString('en-PH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })

  if (cart.length === 0) {
    return (
      <main className="mx-auto max-w-7xl px-6 py-16 text-center">
        <h1 className="text-3xl font-bold">Your Cart</h1>

        <p className="mt-4 text-gray-500">
          Your shopping cart is currently empty.
        </p>

        <Link
          to="/products"
          className="mt-6 inline-block rounded-lg bg-black px-6 py-3 text-white transition hover:bg-gray-800"
        >
          Browse Products
        </Link>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <h1 className="mb-8 text-3xl font-bold">Shopping Cart</h1>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
        {/* Cart Items */}
        <section className="space-y-4 lg:col-span-2">
          {cart.map((item) => (
            <article
              key={item.id}
              className="flex flex-col gap-4 rounded-xl border border-gray-200 p-4 sm:flex-row sm:items-center"
            >
              {/* Product Image */}
              {item.image_url ? (
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="h-28 w-full rounded-lg object-cover sm:w-28"
                />
              ) : (
                <div className="flex h-28 w-full items-center justify-center rounded-lg bg-gray-100 text-sm text-gray-400 sm:w-28">
                  No image
                </div>
              )}

              {/* Product Information */}
              <div className="flex-1">
                <h2 className="font-semibold">{item.name}</h2>

                <p className="mt-1 text-gray-500">
                  ₱{formatPrice(item.price)}
                </p>

                <button
                  onClick={() => removeFromCart(item.id)}
                  className="mt-3 text-sm text-red-600 hover:underline"
                >
                  Remove
                </button>
              </div>

              {/* Quantity Controls */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() =>
                    updateQuantity(item.id, item.quantity - 1)
                  }
                  disabled={item.quantity <= 1}
                  className="h-9 w-9 rounded-lg border border-gray-300 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  -
                </button>

                <span className="min-w-6 text-center font-medium">
                  {item.quantity}
                </span>

                <button
                  onClick={() =>
                    updateQuantity(item.id, item.quantity + 1)
                  }
                  disabled={item.quantity >= item.stock}
                  className="h-9 w-9 rounded-lg border border-gray-300 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  +
                </button>
              </div>

              {/* Line Total */}
              <p className="font-bold sm:w-28 sm:text-right">
                ₱{formatPrice(item.price * item.quantity)}
              </p>
            </article>
          ))}
        </section>

        {/* Order Summary */}
        <aside className="h-fit rounded-xl border border-gray-200 p-6">
          <h2 className="text-xl font-bold">Order Summary</h2>

          <div className="mt-6 flex justify-between text-sm">
            <span className="text-gray-500">Items ({cartCount})</span>
            <span>₱{formatPrice(cartTotal)}</span>
          </div>

          <div className="mt-4 flex justify-between border-t border-gray-200 pt-4">
            <span className="font-semibold">Total</span>
            <span className="text-xl font-bold">
              ₱{formatPrice(cartTotal)}
            </span>
          </div>

          <p className="mt-2 text-xs text-gray-500">
            Taxes and shipping are not included.
          </p>

          <button
            disabled
            className="mt-6 w-full cursor-not-allowed rounded-lg bg-gray-300 px-4 py-3 font-medium text-gray-600"
          >
            Checkout (Coming Next)
          </button>

          <Link
            to="/products"
            className="mt-4 block text-center text-sm text-gray-500 hover:text-black"
          >
            Continue Shopping
          </Link>
        </aside>
      </div>
    </main>
  )
}

export default Cart
