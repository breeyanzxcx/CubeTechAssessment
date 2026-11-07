import { useEffect, useState, useCallback } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Check, ShoppingCart, ArrowLeft, PackageCheck, AlertCircle, Sparkles } from 'lucide-react'
import { api } from '../../services/api'
import { useCart } from '../../context/CartContext'
import { Skeleton } from '../../components/common/Skeleton'
import ErrorMessage from '../../components/common/ErrorMessage'
import EmptyState from '../../components/common/EmptyState'

function ProductDetails() {
  const { id } = useParams()

  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isAdded, setIsAdded] = useState(false)
  const { addToCart, cart } = useCart()

  const fetchProduct = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await api.get(`/products/${id}`)
      if (response && response.data) {
        setProduct(response.data)
      } else {
        setError('Product not found.')
      }
    } catch (err) {
      setError(err.message || 'Failed to load product details.')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchProduct()
  }, [fetchProduct])

  const handleAddToCart = () => {
    if (!product) return
    const success = addToCart(product)
    if (success) {
      setIsAdded(true)
      setTimeout(() => setIsAdded(false), 1200)
    }
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <Skeleton className="h-5 w-32 mb-8" />
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
          <Skeleton className="h-80 sm:h-96 w-full rounded-2xl" />
          <div className="space-y-4">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-9 w-3/4" />
            <Skeleton className="h-8 w-36" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <Link
          to="/products"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-black mb-6"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Products</span>
        </Link>
        <ErrorMessage
          title="Could not display product"
          message={error}
          onRetry={fetchProduct}
        />
      </main>
    )
  }

  if (!product) {
    return (
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <EmptyState
          title="Product not found"
          description="The item you are looking for does not exist or may have been unlisted."
          actionLabel="Back to Catalog"
          actionTo="/products"
        />
      </main>
    )
  }

  const cartItem = cart.find((item) => item.id === product.id)
  const stock = Number(product.stock)
  const isOutOfStock = stock <= 0
  const isMaxInCart = cartItem && cartItem.quantity >= stock

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12 text-left">
      {/* Breadcrumb back link */}
      <Link
        to="/products"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-black transition"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        <span>Back to Products</span>
      </Link>

      <div className="mt-6 grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-12">
        {/* Left: Product Image */}
        <div>
          {product.image_url ? (
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white p-2 shadow-2xs">
              <img
                src={product.image_url}
                alt={product.name}
                className="h-72 sm:h-96 w-full rounded-xl object-cover"
              />
            </div>
          ) : (
            <div className="flex h-72 sm:h-96 w-full items-center justify-center rounded-2xl border border-gray-200 bg-gray-100 text-sm font-medium text-gray-400">
              No image available
            </div>
          )}
        </div>

        {/* Right: Product Details & Purchase Controls */}
        <div className="flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-gray-100 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-gray-700">
                {product.category_name || 'Hardware'}
              </span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                  isOutOfStock
                    ? 'bg-rose-50 text-rose-700'
                    : stock <= 5
                    ? 'bg-amber-50 text-amber-800'
                    : 'bg-emerald-50 text-emerald-700'
                }`}
              >
                {isOutOfStock ? 'Out of Stock' : `${stock} units in stock`}
              </span>
            </div>

            <h1 className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-gray-900 leading-tight">
              {product.name}
            </h1>

            <p className="mt-4 text-2xl sm:text-3xl font-black text-gray-900">
              ₱
              {Number(product.price).toLocaleString('en-PH', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>

            <div className="mt-6 border-t border-gray-100 pt-6">
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Overview & Specs
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-gray-600 whitespace-pre-line">
                {product.description || 'Premium computing hardware manufactured to stringent standards.'}
              </p>
            </div>
          </div>

          {/* Action Box */}
          <div className="mt-8 rounded-2xl border border-gray-200 bg-gray-50/70 p-5 shadow-2xs">
            <div className="flex items-center justify-between text-xs font-medium text-gray-600 mb-3">
              <span>Status</span>
              <span className="font-semibold text-gray-900">
                {isOutOfStock ? 'Unavailable' : 'Available for immediate dispatch'}
              </span>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock || isMaxInCart}
              aria-label={`Add ${product.name} to cart`}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-black py-3 px-6 text-sm font-semibold text-white shadow-2xs transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500"
            >
              {isAdded ? (
                <>
                  <Check className="h-4 w-4 text-emerald-400" />
                  <span>Added to Cart!</span>
                </>
              ) : isOutOfStock ? (
                'Out of Stock'
              ) : isMaxInCart ? (
                `Cart Limit Reached (${cartItem.quantity} in cart)`
              ) : (
                <>
                  <ShoppingCart className="h-4 w-4" />
                  <span>Add to Cart</span>
                </>
              )}
            </button>

            {cartItem && (
              <p className="mt-2.5 text-center text-xs text-gray-500">
                You currently have <strong>{cartItem.quantity}</strong> of this item in your shopping cart.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Related Products */}
      {product.related_products?.length > 0 && (
        <section className="mt-16 sm:mt-24 border-t border-gray-200 pt-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-gray-900">
                Related Products
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-gray-500">
                Customers also viewed gear in this category.
              </p>
            </div>
            <Link
              to="/products"
              className="text-xs font-bold text-black hover:underline"
            >
              View All
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {product.related_products.map((related) => (
              <Link
                key={related.id}
                to={`/products/${related.id}`}
                className="group rounded-2xl border border-gray-200 bg-white p-4 shadow-2xs transition hover:border-black hover:shadow-md"
              >
                {related.image_url ? (
                  <img
                    src={related.image_url}
                    alt={related.name}
                    className="mb-3 h-40 w-full rounded-xl object-cover transition duration-300 group-hover:scale-102"
                  />
                ) : (
                  <div className="mb-3 flex h-40 items-center justify-center rounded-xl bg-gray-100 text-xs text-gray-400">
                    No image available
                  </div>
                )}

                <h3 className="line-clamp-1 text-sm font-bold text-gray-900 group-hover:underline">
                  {related.name}
                </h3>

                <p className="mt-1 text-sm font-black text-gray-900">
                  ₱
                  {Number(related.price).toLocaleString('en-PH', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  )
}

export default ProductDetails