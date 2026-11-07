import { useEffect, useState, useCallback } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import {
  ArrowRight,
  Check,
  PackageOpen,
} from 'lucide-react'
import heroImage from '../../assets/hero.png'
import { api } from '../../services/api'
import { useCart } from '../../context/CartContext'
import { useAuth } from '../../context/AuthContext'
import ErrorMessage from '../../components/common/ErrorMessage'
import EmptyState from '../../components/common/EmptyState'

function Home() {
  const [categories, setCategories] = useState([])
  const [featuredProducts, setFeaturedProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [addedId, setAddedId] = useState(null)

  const { addToCart, cart } = useCart()
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

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

  const formatPrice = (price) =>
    Number(price).toLocaleString('en-PH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })

  const fetchHomeData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [prodRes, catRes] = await Promise.all([
        api.get('/products'),
        api.get('/categories'),
      ])

      if (prodRes && prodRes.success) {
        setFeaturedProducts((prodRes.data || []).slice(0, 8))
      }

      if (catRes && catRes.success) {
        setCategories(catRes.data || [])
      }
    } catch (err) {
      console.error('Error loading homepage data:', err)
      setError(err.message || 'Failed to connect to the store database.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchHomeData()
  }, [fetchHomeData])

  return (
    <div className="space-y-16 pb-16 text-left">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-gray-50 via-white to-white py-12 md:py-20 border-b border-gray-100">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
            {/* Hero Copy */}
            <div className="space-y-6">
              <h1 className="text-4xl font-black tracking-tight text-gray-900 sm:text-5xl lg:text-6xl leading-[1.1]">
                Elevate Your Tech Setup With CubeTech.
              </h1>

              <p className="max-w-xl text-base text-gray-600 sm:text-lg leading-relaxed">
                Discover high-performance mechanical keyboards, wireless audio, office ergonomics, and computing essentials designed for creators and professionals.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Link
                  to="/products"
                  className="inline-flex items-center justify-center rounded-xl bg-black px-6 py-3.5 text-sm font-semibold text-white shadow-xs transition hover:bg-gray-800"
                >
                  Browse Catalog
                </Link>

                <a
                  href="#categories"
                  className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-6 py-3.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 hover:text-black"
                >
                  Explore Categories
                </a>
              </div>
            </div>

            {/* Hero Image */}
            <div className="relative flex justify-center">
              <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-gray-200 bg-gray-100 p-2">
                <img
                  src={heroImage}
                  alt="CubeTech Hero Tech Collection"
                  className="h-auto w-full rounded-2xl object-cover transition duration-300 hover:scale-102"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. VALUE PROPOSITIONS BANNER */}
      <section className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-2xs">
          {[
            {
              title: 'Authentic Gear',
              desc: '100% genuine products directly sourced from verified brands.',
            },
            {
              title: 'Fast Nationwide Delivery',
              desc: 'Trackable and secure shipping delivered straight to your door.',
            },
            {
              title: 'Flexible Payments',
              desc: 'Cash on delivery, GCash / E-wallets, and direct bank transfer.',
            },
            {
              title: 'Hassle-Free Returns',
              desc: '7-day replacement warranty for manufacturing defects.',
            },
          ].map((item, idx) => (
            <div key={idx} className="flex flex-col">
              <h4 className="text-sm font-bold text-gray-900">{item.title}</h4>
              <p className="mt-1 text-xs text-gray-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 3. CATEGORIES SECTION */}
      <section id="categories" className="mx-auto max-w-7xl px-6 scroll-mt-24">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-3">
          <div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight sm:text-3xl">
              Shop by Category
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Browse equipment tailored to your workspace needs.
            </p>
          </div>

          <Link
            to="/products"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-black hover:underline"
          >
            <span>View All</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <Link
              key={category.id}
              to={`/products?category=${category.id}`}
              className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-2xs transition hover:border-black hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900 group-hover:text-black">
                  {category.name}
                </h3>
                <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">
                  {category.active_product_count ?? category.product_count ?? 0} items
                </span>
              </div>

              <p className="mt-2 text-xs text-gray-500 line-clamp-2 leading-relaxed">
                {category.description || 'Quality computing and accessories.'}
              </p>

              <div className="mt-6 flex items-center gap-1.5 text-xs font-semibold text-black transition group-hover:translate-x-1">
                <span>Browse Products</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 4. FEATURED PRODUCTS SECTION */}
      <section className="mx-auto max-w-7xl px-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-3">
          <div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight sm:text-3xl">
              Featured Products
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Top-rated gear in stock and ready to ship.
            </p>
          </div>

          <Link
            to="/products"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-black hover:underline"
          >
            <span>Explore All Products</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="h-72 animate-pulse rounded-2xl bg-gray-100 border border-gray-200"
              />
            ))}
          </div>
        ) : error ? (
          <ErrorMessage
            title="Unable to load catalog"
            message={error}
            onRetry={fetchHomeData}
          />
        ) : featuredProducts.length === 0 ? (
          <EmptyState
            icon={PackageOpen}
            title="No featured gear available"
            description="Our featured inventory will be replenished soon. Check back shortly."
            actionLabel="View All Products"
            actionTo="/products"
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => {
              const cartItem = cart.find((item) => item.id === product.id)
              const isMaxInCart =
                cartItem && cartItem.quantity >= Number(product.stock)
              const isOutOfStock = Number(product.stock) <= 0
              const isRecentlyAdded = addedId === product.id

              return (
                <article
                  key={product.id}
                  className="flex flex-col justify-between rounded-2xl border border-gray-200 bg-white p-4 shadow-2xs transition hover:shadow-md"
                >
                  <div>
                    {/* Image */}
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="mb-4 h-48 w-full rounded-xl bg-gray-100 object-cover"
                      />
                    ) : (
                      <div className="mb-4 flex h-48 w-full items-center justify-center rounded-xl bg-gray-100 text-xs text-gray-400">
                        No image available
                      </div>
                    )}

                    {/* Category & Name */}
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                      {product.category_name}
                    </span>

                    <h3 className="mt-1 font-bold text-gray-900 text-sm line-clamp-1">
                      {product.name}
                    </h3>

                    {/* Price & Stock */}
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-base font-black text-gray-900">
                        ₱{formatPrice(product.price)}
                      </span>

                      {isOutOfStock ? (
                        <span className="rounded-md bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-600">
                          Out of Stock
                        </span>
                      ) : Number(product.stock) <= 5 ? (
                        <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                          {product.stock} left
                        </span>
                      ) : (
                        <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                          In Stock
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="mt-4 flex flex-col gap-2">
                    <Link
                      to={`/products/${product.id}`}
                      className="w-full rounded-lg border border-gray-200 py-2 text-center text-xs font-semibold text-gray-700 transition hover:bg-gray-50 hover:text-black"
                    >
                      View Details
                    </Link>

                    <button
                      onClick={() => handleAddToCart(product)}
                      disabled={isOutOfStock || isMaxInCart}
                      className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-black py-2 text-xs font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
                    >
                      {isRecentlyAdded ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-400" />
                          <span>Added!</span>
                        </>
                      ) : isOutOfStock ? (
                        'Out of Stock'
                      ) : isMaxInCart ? (
                        `Limit reached (${cartItem.quantity} in cart)`
                      ) : (
                        'Add to Cart'
                      )}
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>

      {/* 5. CTA PROMO BANNER */}
      <section className="mx-auto max-w-7xl px-6">
        <div className="rounded-3xl bg-black p-8 sm:p-12 text-center text-white relative overflow-hidden">
          <div className="relative z-10 max-w-2xl mx-auto space-y-4">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              Ready to Upgrade Your Setup?
            </h2>
            <p className="text-sm sm:text-base text-gray-400 leading-relaxed">
              Explore our complete product catalog with free warranty and nationwide checkout today.
            </p>
            <div className="pt-2">
              <Link
                to="/products"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3 text-sm font-bold text-black transition hover:bg-gray-100 shadow-md"
              >
                <span>Shop All Tech</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home

