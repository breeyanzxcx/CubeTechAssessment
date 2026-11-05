import { useEffect, useMemo, useState } from 'react'
import { api } from '../../services/api'

function Products() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])

  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortOrder, setSortOrder] = useState('default')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchData() {
      try {
        const [productResponse, categoryResponse] = await Promise.all([
          api.get('/products'),
          api.get('/categories'),
        ])

        setProducts(productResponse.data)
        setCategories(categoryResponse.data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const filteredProducts = useMemo(() => {
    let result = [...products]

    // Search by product name
    if (search.trim()) {
      result = result.filter((product) =>
        product.name.toLowerCase().includes(search.trim().toLowerCase())
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

  if (loading) {
    return <p className="p-8">Loading products...</p>
  }

  if (error) {
    return <p className="p-8 text-red-600">{error}</p>
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Our Products</h1>
        <p className="mt-2 text-gray-500">
          Browse our available products.
        </p>
      </div>

      {/* Search and filters */}
      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
        />

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="rounded-lg border border-gray-300 px-4 py-3"
        >
          <option value="all">All Categories</option>

          {categories.map((category) => (
            <option key={category.id} value={String(category.id)}>
              {category.name}
            </option>
          ))}
        </select>

        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          className="rounded-lg border border-gray-300 px-4 py-3"
        >
          <option value="default">Default Sorting</option>
          <option value="low-to-high">Price: Low to High</option>
          <option value="high-to-low">Price: High to Low</option>
        </select>
      </div>

      {/* Product count */}
      <p className="mb-5 text-sm text-gray-500">
        Showing {filteredProducts.length} of {products.length} products
      </p>

      {/* Product grid */}
      {filteredProducts.length === 0 ? (
        <div className="rounded-lg bg-gray-50 py-16 text-center">
          <p className="text-gray-500">No products found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {filteredProducts.map((product) => (
            <article
              key={product.id}
              className="rounded-xl border border-gray-200 p-4"
            >
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="mb-4 h-48 w-full rounded-lg object-cover"
                />
              ) : (
                <div className="mb-4 flex h-48 items-center justify-center rounded-lg bg-gray-100 text-gray-400">
                  No image
                </div>
              )}

              <p className="text-sm text-gray-500">
                {product.category_name}
              </p>

              <h2 className="mt-1 font-semibold">
                {product.name}
              </h2>

              <p className="mt-2 font-bold">
                ₱{Number(product.price).toLocaleString('en-PH', {
                  minimumFractionDigits: 2,
                })}
              </p>

              <p className="mt-1 text-sm text-gray-500">
                {Number(product.stock) > 0
                  ? `${product.stock} in stock`
                  : 'Out of stock'}
              </p>

              <button
                disabled={Number(product.stock) <= 0}
                className="mt-4 w-full rounded-lg bg-black px-4 py-2 text-white disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                {Number(product.stock) > 0 ? 'Add to Cart' : 'Out of Stock'}
              </button>
            </article>
          ))}
        </div>
      )}
    </main>
  )
}

export default Products
