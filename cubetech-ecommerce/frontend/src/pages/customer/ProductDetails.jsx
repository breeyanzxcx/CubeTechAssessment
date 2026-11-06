import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Check } from 'lucide-react'
import { api } from '../../services/api'
import { useCart } from '../../context/CartContext'

function ProductDetails() {
  const { id } = useParams()

  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isAdded, setIsAdded] = useState(false)
  const { addToCart, cart } = useCart()

  const handleAddToCart = () => {
    if (!product) return
    const success = addToCart(product)
    if (success) {
      setIsAdded(true)
      setTimeout(() => setIsAdded(false), 1200)
    }
  }
  
  useEffect(() => {
    async function fetchProduct() {
      try {
        const response = await api.get(`/products/${id}`)
        setProduct(response.data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [id])

  if (loading) {
    return <p className="p-8">Loading product...</p>
  }

  if (error) {
    return <p className="p-8 text-red-600">{error}</p>
  }

  if (!product) {
    return <p className="p-8">Product not found.</p>
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <Link to="/products" className="text-sm text-gray-500 hover:text-black">
        ← Back to Products
      </Link>

      <div className="mt-8 grid grid-cols-1 gap-10 md:grid-cols-2">
        <div>
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="h-96 w-full rounded-xl bg-gray-100 object-cover"
            />
          ) : (
            <div className="flex h-96 items-center justify-center rounded-xl bg-gray-100 text-gray-400">
              No image available
            </div>
          )}
        </div>

        <div>
          <p className="text-sm text-gray-500">
            {product.category_name}
          </p>

          <h1 className="mt-2 text-3xl font-bold">
            {product.name}
          </h1>

          <p className="mt-4 text-2xl font-bold">
            ₱{Number(product.price).toLocaleString('en-PH', {
              minimumFractionDigits: 2,
            })}
          </p>

          <p className="mt-4 leading-7 text-gray-600">
            {product.description || 'No description available.'}
          </p>

          <p className="mt-6 text-sm text-gray-500">
            {Number(product.stock) > 0
              ? `${product.stock} units available`
              : 'Currently out of stock'}
          </p>

          {(() => {
            const cartItem = cart.find((item) => item.id === product.id)
            const isMaxInCart =
              cartItem && cartItem.quantity >= Number(product.stock)
            const isOutOfStock = Number(product.stock) <= 0

            return (
              <button
                onClick={handleAddToCart}
                disabled={isOutOfStock || isMaxInCart}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-black px-4 py-2.5 font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                {isAdded ? (
                  <>
                    <Check className="h-5 w-5 text-emerald-400" />
                    <span>Added to Cart!</span>
                  </>
                ) : isOutOfStock ? (
                  'Out of Stock'
                ) : isMaxInCart ? (
                  `Limit Reached (${cartItem.quantity} in cart)`
                ) : (
                  'Add to Cart'
                )}
              </button>
            )
          })()}
        </div>
      </div>

      {product.related_products?.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-6 text-2xl font-bold">
            Related Products
          </h2>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {product.related_products.map((related) => (
              <Link
                key={related.id}
                to={`/products/${related.id}`}
                className="rounded-xl border border-gray-200 p-4 transition hover:shadow-md"
              >
                {related.image_url ? (
                  <img
                    src={related.image_url}
                    alt={related.name}
                    className="mb-4 h-40 w-full rounded-lg object-cover"
                  />
                ) : (
                  <div className="mb-4 flex h-40 items-center justify-center rounded-lg bg-gray-100 text-gray-400">
                    No image
                  </div>
                )}

                <h3 className="font-semibold">{related.name}</h3>

                <p className="mt-2 font-bold">
                  ₱{Number(related.price).toLocaleString('en-PH', {
                    minimumFractionDigits: 2,
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