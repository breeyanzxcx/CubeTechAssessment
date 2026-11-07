import { useEffect, useMemo, useState, useCallback } from 'react'
import { Link, useSearchParams, useNavigate, useLocation } from 'react-router-dom'
import { Check, ShoppingCart, Search, Filter, SlidersHorizontal, PackageSearch } from 'lucide-react'
import { api } from '../../services/api'
import { useCart } from '../../context/CartContext'
import { useAuth } from '../../context/AuthContext'
import { ProductCardSkeleton } from '../../components/common/Skeleton'
import ErrorMessage from '../../components/common/ErrorMessage'
import EmptyState from '../../components/common/EmptyState'

function Products() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()
  const initialCategory = searchParams.get('category') || 'all'
  const initialSearch = searchParams.get('search') || ''

  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])

  const [search, setSearch] = useState(initialSearch)
  const [selectedCategory, setSelectedCategory] = useState(initialCategory)
  const [sortOrder, setSortOrder] = useState('default')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [addedId, setAddedId] = useState(null)

  const { addToCart, cart } = useCart()
  const { isAuthenticated } = useAuth()

  useEffect(() => {
    const categoryParam = searchParams.get('category')
    if (categoryParam) {
      setSelectedCategory(categoryParam)
    }
    const searchParam = searchParams.get('search')
    if (searchParam) {
      setSearch(searchParam)
    }
  }, [searchParams])

  const handleAddToCart = (product) => {
    if (!isAuthenticated) {
      navigate('/login', {
        state: {
          from: location,
          message: 'Please sign in to your account to add items to your cart.',
        },
      })
      return
    }

    const success = addToCart(product)
    if (success) {
      setAddedId(product.id)
      setTimeout(() => {
        setAddedId((curr) => (curr === product.id ? null : curr))
      }, 1200)
    }
  }

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [productResponse, categoryResponse] = await Promise.all([
        api.get('/products'),
        api.get('/categories'),
      ])

      setProducts(productResponse.data || [])
      setCategories(categoryResponse.data || [])
    } catch (err) {
      setError(err.message || 'Failed to fetch catalog products.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleResetFilters = () => {
    setSearch('')
    setSelectedCategory('all')
    setSortOrder('default')
    setSearchParams({})
  }

  const filteredProducts = useMemo(() => {
    let result = [...products]

    // Search by product name or description
    if (search.trim()) {
      const term = search.trim().toLowerCase()
      result = result.filter(
        (product) =>
          product.name.toLowerCase().includes(term) ||
          (product.description && product.description.toLowerCase().includes(term))
      )
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      result = result.filter(
        (product) => String(product.category_id) === selectedCategory
      )
    }

    // Sort by price
    if (sortOrder === 'low-to-high') {
      result.sort((a, b) => Number(a.price) - Number(b.price))
    } else if (sortOrder === 'high-to-low') {
      result.sort((a, b) => Number(b.price) - Number(a.price))
    }

    return result
  }, [products, search, selectedCategory, sortOrder])

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-gray-900">
          Our Products
        </h1>
        <p className="mt-2 text-sm sm:text-base text-gray-600">
          Explore top-grade tech equipment, mechanical keyboards, displays, and desktop essentials.
        </p>
      </div>

      {/* Search and filters toolbar */}
      <div className="mb-8 grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-black focus:ring-1 focus:ring-black shadow-2xs"
          />
        </div>

        <div className="relative">
          <Filter className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full appearance-none rounded-xl border border-gray-300 bg-white py-2.5 pl-10 pr-10 text-sm text-gray-900 outline-none transition focus:border-black focus:ring-1 focus:ring-black shadow-2xs"
          >
            <option value="all">All Categories</option>
            {categories.map((category) => (
              <option key={category.id} value={String(category.id)}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div className="relative sm:col-span-2 lg:col-span-1">
          <SlidersHorizontal className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="w-full appearance-none rounded-xl border border-gray-300 bg-white py-2.5 pl-10 pr-10 text-sm text-gray-900 outline-none transition focus:border-black focus:ring-1 focus:ring-black shadow-2xs"
          >
            <option value="default">Default Sorting</option>
            <option value="low-to-high">Price: Low to High</option>
            <option value="high-to-low">Price: High to Low</option>
          </select>
        </div>
      </div>

      {/* Status feedback & product count */}
      {loading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <ErrorMessage
          title="Could not load products"
          message={error}
          onRetry={fetchData}
        />
      ) : filteredProducts.length === 0 ? (
        <EmptyState
          icon={PackageSearch}
          title="No products found"
          description={
            search || selectedCategory !== 'all'
              ? 'No products matched your search or category filter. Try clearing your filters.'
              : 'Our product inventory is currently empty. Please check back later.'
          }
          actionLabel={search || selectedCategory !== 'all' ? 'Reset Filters' : null}
          onAction={handleResetFilters}
        />
      ) : (
        <>
          <div className="mb-4 flex items-center justify-between text-xs font-medium text-gray-500">
            <span>
              Showing <strong className="text-gray-900">{filteredProducts.length}</strong> of{' '}
              {products.length} products
            </span>
            {(search || selectedCategory !== 'all' || sortOrder !== 'default') && (
              <button
                onClick={handleResetFilters}
                className="text-gray-600 hover:text-black underline transition"
              >
                Clear all filters
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {filteredProducts.map((product) => {
              const cartItem = cart.find((item) => item.id === product.id)
              const stock = Number(product.stock)
              const isOutOfStock = stock <= 0
              const isMaxInCart = cartItem && cartItem.quantity >= stock
              const isRecentlyAdded = addedId === product.id

              return (
                <article
                  key={product.id}
                  className="flex flex-col justify-between rounded-2xl border border-gray-200 bg-white p-4 shadow-2xs transition duration-200 hover:border-gray-400 hover:shadow-md"
                >
                  <div>
                    {/* Image */}
                    <Link
                      to={`/products/${product.id}`}
                      className="group block overflow-hidden rounded-xl bg-gray-100"
                    >
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="h-48 w-full object-cover transition duration-300 group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-48 w-full items-center justify-center text-xs font-medium text-gray-400">
                          No image available
                        </div>
                      )}
                    </Link>

                    {/* Metadata */}
                    <div className="mt-3.5 flex items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                        {product.category_name || 'Gear'}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          isOutOfStock
                            ? 'bg-rose-50 text-rose-700'
                            : stock <= 5
                            ? 'bg-amber-50 text-amber-800'
                            : 'bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        {isOutOfStock ? 'Sold Out' : `${stock} left`}
                      </span>
                    </div>

                    <Link to={`/products/${product.id}`} className="group">
                      <h2 className="mt-1 line-clamp-1 text-sm font-bold text-gray-900 group-hover:underline">
                        {product.name}
                      </h2>
                    </Link>

                    <p className="mt-2 text-base font-black text-gray-900">
                      ₱
                      {Number(product.price).toLocaleString('en-PH', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 flex flex-col gap-2 pt-2 border-t border-gray-100">
                    <Link
                      to={`/products/${product.id}`}
                      className="w-full rounded-xl border border-gray-200 py-2 text-center text-xs font-semibold text-gray-700 transition hover:bg-gray-50 hover:text-black"
                    >
                      View Details
                    </Link>

                    <button
                      onClick={() => handleAddToCart(product)}
                      disabled={isOutOfStock || isMaxInCart}
                      aria-label={`Add ${product.name} to cart`}
                      className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-black py-2 text-xs font-semibold text-white shadow-2xs transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
                    >
                      {isRecentlyAdded ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-400" />
                          <span>Added to Cart!</span>
                        </>
                      ) : isOutOfStock ? (
                        <span>Out of Stock</span>
                      ) : isMaxInCart ? (
                        <span>Max in Cart ({cartItem.quantity})</span>
                      ) : (
                        <>
                          <ShoppingCart className="h-3.5 w-3.5" />
                          <span>Add to Cart</span>
                        </>
                      )}
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        </>
      )}
    </main>
  )
}

export default Products
