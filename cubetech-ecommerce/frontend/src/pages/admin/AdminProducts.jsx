import { useEffect, useState, useMemo } from 'react'
import {
  Package,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle2,
  X,
  RefreshCw,
  Image as ImageIcon,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  ShieldAlert,
  ArrowUpRight,
} from 'lucide-react'
import { api } from '../../services/api'

function formatPrice(amount) {
  const num = Number(amount) || 0
  return `₱${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default function AdminProducts() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [refreshing, setRefreshing] = useState(false)

  // Filters state
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL') // 'ALL', 'active', 'inactive', 'low_stock', 'out_of_stock'

  // Modal states
  const [modalOpen, setModalOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [currentProductId, setCurrentProductId] = useState(null)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    category_id: '',
    price: '',
    stock: '',
    description: '',
    image_url: '',
    is_active: true,
  })
  const [formErrors, setFormErrors] = useState({})
  const [formSubmitting, setFormSubmitting] = useState(false)
  const [formServerError, setFormServerError] = useState(null)

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState(null)
  const [deleteError, setDeleteError] = useState(null)
  const [deleteReferenced, setDeleteReferenced] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Toast notification state
  const [toast, setToast] = useState(null)

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  // Fetch products and categories
  const fetchData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    setError(null)

    try {
      const [prodRes, catRes] = await Promise.all([
        api.get('/admin/products'),
        api.get('/categories'),
      ])

      if (prodRes && prodRes.success) {
        setProducts(prodRes.data || [])
      } else {
        setError(prodRes?.message || 'Failed to load products.')
      }

      if (catRes && catRes.success) {
        setCategories(catRes.data || [])
      }
    } catch (err) {
      setError(err.message || 'Error connecting to product service.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // Search filter
      const matchesSearch =
        search.trim() === '' ||
        product.name.toLowerCase().includes(search.toLowerCase()) ||
        (product.description && product.description.toLowerCase().includes(search.toLowerCase()))

      // Category filter
      const matchesCategory =
        categoryFilter === 'ALL' || String(product.category_id) === String(categoryFilter)

      // Status filter
      let matchesStatus = true
      if (statusFilter === 'active') {
        matchesStatus = Boolean(Number(product.is_active))
      } else if (statusFilter === 'inactive') {
        matchesStatus = !Number(product.is_active)
      } else if (statusFilter === 'out_of_stock') {
        matchesStatus = Number(product.stock) === 0
      } else if (statusFilter === 'low_stock') {
        matchesStatus = Number(product.stock) > 0 && Number(product.stock) <= 5
      }

      return matchesSearch && matchesCategory && matchesStatus
    })
  }, [products, search, categoryFilter, statusFilter])

  // Aggregate stats
  const stats = useMemo(() => {
    const total = products.length
    const active = products.filter((p) => Number(p.is_active) === 1).length
    const inactive = total - active
    const outOfStock = products.filter((p) => Number(p.stock) === 0).length
    const lowStock = products.filter((p) => Number(p.stock) > 0 && Number(p.stock) <= 5).length
    return { total, active, inactive, outOfStock, lowStock }
  }, [products])

  // Open modal for adding a new product
  const handleOpenAdd = () => {
    setIsEditing(false)
    setCurrentProductId(null)
    setFormData({
      name: '',
      category_id: categories.length > 0 ? String(categories[0].id) : '',
      price: '',
      stock: '0',
      description: '',
      image_url: '',
      is_active: true,
    })
    setFormErrors({})
    setFormServerError(null)
    setModalOpen(true)
  }

  // Open modal for editing an existing product
  const handleOpenEdit = (product) => {
    setIsEditing(true)
    setCurrentProductId(product.id)
    setFormData({
      name: product.name || '',
      category_id: String(product.category_id || ''),
      price: String(product.price || ''),
      stock: String(product.stock ?? '0'),
      description: product.description || '',
      image_url: product.image_url || '',
      is_active: Boolean(Number(product.is_active)),
    })
    setFormErrors({})
    setFormServerError(null)
    setModalOpen(true)
  }

  // Client-side form validation
  const validateForm = () => {
    const errors = {}

    // Name
    if (!formData.name.trim()) {
      errors.name = 'Product name is required.'
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Product name must be at least 2 characters.'
    }

    // Category
    if (!formData.category_id) {
      errors.category_id = 'Please select a product category.'
    }

    // Price
    if (formData.price === '' || formData.price === null) {
      errors.price = 'Price is required.'
    } else {
      const priceNum = parseFloat(formData.price)
      if (isNaN(priceNum) || priceNum < 0) {
        errors.price = 'Price must be a valid non-negative number.'
      }
    }

    // Stock
    if (formData.stock === '' || formData.stock === null) {
      errors.stock = 'Stock quantity is required.'
    } else {
      const stockNum = Number(formData.stock)
      if (isNaN(stockNum) || !Number.isInteger(stockNum) || stockNum < 0) {
        errors.stock = 'Stock must be a non-negative whole number (integer).'
      }
    }

    // Image URL validation (optional, but if provided should be valid format)
    if (formData.image_url && formData.image_url.trim()) {
      const url = formData.image_url.trim()
      if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('/')) {
        errors.image_url = 'Image URL should start with http://, https://, or /'
      }
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Handle form submit (Create or Update)
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    setFormSubmitting(true)
    setFormServerError(null)

    const payload = {
      name: formData.name.trim(),
      category_id: parseInt(formData.category_id, 10),
      price: parseFloat(formData.price),
      stock: parseInt(formData.stock, 10),
      description: formData.description.trim() || null,
      image_url: formData.image_url.trim() || null,
      is_active: formData.is_active,
    }

    try {
      if (isEditing) {
        const res = await api.put(`/admin/products/${currentProductId}`, payload)
        if (res && res.success) {
          showToast(`Product "${payload.name}" updated successfully.`)
          setModalOpen(false)
          fetchData(true)
        } else {
          setFormServerError(res?.message || 'Failed to update product.')
        }
      } else {
        const res = await api.post('/admin/products', payload)
        if (res && res.success) {
          showToast(`Product "${payload.name}" created successfully.`)
          setModalOpen(false)
          fetchData(true)
        } else {
          setFormServerError(res?.message || 'Failed to create product.')
        }
      }
    } catch (err) {
      setFormServerError(err.message || 'An unexpected error occurred.')
    } finally {
      setFormSubmitting(false)
    }
  }

  // Toggle active/inactive status directly from list
  const handleToggleStatus = async (product) => {
    const newStatus = !Number(product.is_active)
    try {
      const res = await api.put(`/admin/products/${product.id}`, {
        is_active: newStatus,
      })

      if (res && res.success) {
        // Optimistic local state update
        setProducts((prev) =>
          prev.map((p) => (p.id === product.id ? { ...p, is_active: newStatus ? 1 : 0 } : p))
        )
        showToast(
          `Product "${product.name}" is now ${newStatus ? 'Active' : 'Inactive'}.`,
          newStatus ? 'success' : 'info'
        )
      } else {
        showToast(res?.message || 'Failed to update status.', 'error')
      }
    } catch (err) {
      showToast(err.message || 'Error updating product status.', 'error')
    }
  }

  // Open delete confirmation modal
  const handleOpenDelete = (product) => {
    setProductToDelete(product)
    setDeleteError(null)
    setDeleteReferenced(false)
    setDeleteModalOpen(true)
  }

  // Execute product deletion
  const handleDeleteConfirm = async () => {
    if (!productToDelete) return
    setDeleteLoading(true)
    setDeleteError(null)

    try {
      const res = await api.delete(`/admin/products/${productToDelete.id}`)
      if (res && res.success) {
        showToast(`Product "${productToDelete.name}" was permanently deleted.`)
        setDeleteModalOpen(false)
        fetchData(true)
      } else {
        setDeleteError(res?.message || 'Failed to delete product.')
      }
    } catch (err) {
      const msg = err.message || ''
      setDeleteError(msg)
      // Check if product is referenced in orders (HTTP 409 conflict)
      if (msg.toLowerCase().includes('order') || msg.toLowerCase().includes('referenced') || msg.toLowerCase().includes('foreign key')) {
        setDeleteReferenced(true)
      }
    } finally {
      setDeleteLoading(false)
    }
  }

  // Deactivate instead of delete
  const handleDeactivateInstead = async () => {
    if (!productToDelete) return
    setDeleteLoading(true)

    try {
      const res = await api.put(`/admin/products/${productToDelete.id}`, {
        is_active: false,
      })

      if (res && res.success) {
        showToast(`Product "${productToDelete.name}" has been deactivated successfully.`, 'info')
        setDeleteModalOpen(false)
        fetchData(true)
      } else {
        setDeleteError(res?.message || 'Failed to deactivate product.')
      }
    } catch (err) {
      setDeleteError(err.message || 'Failed to deactivate product.')
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Toast Alert Banner */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl px-4 py-3 shadow-lg transition-all animate-bounce ${
            toast.type === 'error'
              ? 'bg-rose-600 text-white'
              : toast.type === 'info'
              ? 'bg-gray-900 text-white'
              : 'bg-emerald-600 text-white'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertCircle className="h-4 w-4" />
          ) : (
            <CheckCircle2 className="h-4 w-4" />
          )}
          <span className="text-xs font-semibold">{toast.message}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Product Management</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Manage your store catalog, real-time stock levels, pricing, and customer visibility.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 shadow-2xs transition hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-gray-800"
          >
            <Plus className="h-4 w-4" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        <div className="rounded-xl border border-gray-200 bg-white p-3.5 shadow-2xs">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Total</span>
          <p className="text-xl font-bold text-gray-900 mt-1">{stats.total}</p>
          <span className="text-[11px] text-gray-500">All products</span>
        </div>

        <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-3.5 shadow-2xs">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600">Active</span>
          <p className="text-xl font-bold text-emerald-700 mt-1">{stats.active}</p>
          <span className="text-[11px] text-emerald-600/80">Visible in store</span>
        </div>

        <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-3.5 shadow-2xs">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Inactive</span>
          <p className="text-xl font-bold text-gray-700 mt-1">{stats.inactive}</p>
          <span className="text-[11px] text-gray-400">Hidden from catalog</span>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3.5 shadow-2xs">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-700">Low Stock</span>
          <p className="text-xl font-bold text-amber-800 mt-1">{stats.lowStock}</p>
          <span className="text-[11px] text-amber-600">&le; 5 units left</span>
        </div>

        <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-3.5 shadow-2xs">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-rose-700">Out of Stock</span>
          <p className="text-xl font-bold text-rose-800 mt-1">{stats.outOfStock}</p>
          <span className="text-[11px] text-rose-600">0 units remaining</span>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search products by name or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-gray-50/50 pl-9 pr-8 py-2 text-xs focus:border-black focus:bg-white focus:outline-hidden transition"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-500 whitespace-nowrap">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 focus:border-black focus:outline-hidden transition"
            >
              <option value="ALL">All Categories ({categories.length})</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-gray-100 text-xs">
          <span className="text-gray-400 mr-2 font-medium">Status:</span>
          {[
            { id: 'ALL', label: 'All', count: stats.total },
            { id: 'active', label: 'Active', count: stats.active },
            { id: 'inactive', label: 'Inactive', count: stats.inactive },
            { id: 'low_stock', label: 'Low Stock', count: stats.lowStock },
            { id: 'out_of_stock', label: 'Out of Stock', count: stats.outOfStock },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`rounded-lg px-3 py-1 font-semibold transition ${
                statusFilter === tab.id
                  ? 'bg-gray-900 text-white shadow-2xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab.label} <span className="opacity-70 text-[10px]">({tab.count})</span>
            </button>
          ))}

          {(search || categoryFilter !== 'ALL' || statusFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSearch('')
                setCategoryFilter('ALL')
                setStatusFilter('ALL')
              }}
              className="ml-auto text-xs font-semibold text-rose-600 hover:text-rose-800 transition"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Main Products Table View */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-2xs overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-500">
            <RefreshCw className="h-8 w-8 animate-spin text-gray-400 mb-3" />
            <p className="text-sm font-medium">Loading catalog products...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-700 bg-rose-50/50">
            <AlertCircle className="h-8 w-8 mx-auto text-rose-500 mb-2" />
            <p className="font-semibold text-sm">{error}</p>
            <button
              onClick={() => fetchData(true)}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700"
            >
              <RefreshCw className="h-3 w-3" /> Retry
            </button>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-20 text-center text-gray-500">
            <Package className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-base font-bold text-gray-700">No products found</p>
            <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
              {search || categoryFilter !== 'ALL' || statusFilter !== 'ALL'
                ? 'Try adjusting your filters or search keywords.'
                : 'Start by clicking "Add Product" to create your first catalog item.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[760px]">
              <thead className="bg-gray-50/75 border-b border-gray-100 text-gray-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-6 py-3.5">Product</th>
                  <th className="px-6 py-3.5">Category</th>
                  <th className="px-6 py-3.5">Price</th>
                  <th className="px-6 py-3.5">Stock Status</th>
                  <th className="px-6 py-3.5">Store Visibility</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {filteredProducts.map((product) => {
                  const isActive = Boolean(Number(product.is_active))
                  const stockNum = Number(product.stock)

                  return (
                    <tr
                      key={product.id}
                      className={`hover:bg-gray-50/60 transition ${
                        !isActive ? 'bg-gray-50/40 text-gray-400' : ''
                      }`}
                    >
                      {/* Product Name & Thumbnail */}
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="h-11 w-11 shrink-0 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden">
                            {product.image_url ? (
                              <img
                                src={product.image_url}
                                alt={product.name}
                                className="h-full w-full object-cover"
                                onError={(e) => {
                                  e.target.onerror = null
                                  e.target.style.display = 'none'
                                }}
                              />
                            ) : (
                              <Package className="h-5 w-5 text-gray-400" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-gray-900 truncate flex items-center gap-1.5">
                              <span>{product.name}</span>
                              {!isActive && (
                                <span className="rounded-md bg-gray-200 px-1.5 py-0.5 text-[9px] font-semibold text-gray-600 uppercase">
                                  Inactive
                                </span>
                              )}
                            </p>
                            <p className="text-[11px] text-gray-400 line-clamp-1 mt-0.5">
                              {product.description || 'No description provided.'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-6 py-3.5 whitespace-nowrap">
                        <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-700">
                          {product.category_name}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="px-6 py-3.5 whitespace-nowrap font-bold text-gray-900">
                        {formatPrice(product.price)}
                      </td>

                      {/* Stock Level */}
                      <td className="px-6 py-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold ${
                            stockNum === 0
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : stockNum <= 5
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          }`}
                        >
                          {stockNum === 0 ? 'Out of Stock' : `${stockNum} in stock`}
                        </span>
                      </td>

                      {/* Toggle Active / Inactive Status */}
                      <td className="px-6 py-3.5 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleStatus(product)}
                          title={`Click to ${isActive ? 'deactivate' : 'activate'}`}
                          className={`group inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${
                            isActive
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                          }`}
                        >
                          {isActive ? (
                            <>
                              <Eye className="h-3.5 w-3.5 text-emerald-600" />
                              <span>Active</span>
                            </>
                          ) : (
                            <>
                              <EyeOff className="h-3.5 w-3.5 text-gray-500" />
                              <span>Inactive</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-3.5 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(product)}
                            title="Edit Product"
                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>

                          <button
                            onClick={() => handleOpenDelete(product)}
                            title="Delete or Deactivate Product"
                            className="p-1.5 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* =========================================================================
          ADD / EDIT PRODUCT MODAL
      ========================================================================= */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-gray-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => !formSubmitting && setModalOpen(false)}
          />

          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl transition-all">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  {isEditing ? 'Edit Product' : 'Add New Product'}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {isEditing
                    ? 'Update product details, pricing, stock, and store availability.'
                    : 'Fill in the information to publish a new product to your catalog.'}
                </p>
              </div>
              <button
                onClick={() => !formSubmitting && setModalOpen(false)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {formServerError && (
              <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>{formServerError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              {/* Product Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Product Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., Mechanical RGB Keyboard"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value })
                    if (formErrors.name) setFormErrors({ ...formErrors, name: null })
                  }}
                  className={`w-full rounded-lg border px-3 py-2 text-xs focus:outline-hidden transition ${
                    formErrors.name ? 'border-rose-300 bg-rose-50/30' : 'border-gray-200 focus:border-black'
                  }`}
                />
                {formErrors.name && (
                  <p className="mt-1 text-[11px] text-rose-600">{formErrors.name}</p>
                )}
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Category <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.category_id}
                  onChange={(e) => {
                    setFormData({ ...formData, category_id: e.target.value })
                    if (formErrors.category_id) setFormErrors({ ...formErrors, category_id: null })
                  }}
                  className={`w-full rounded-lg border px-3 py-2 text-xs focus:outline-hidden transition ${
                    formErrors.category_id ? 'border-rose-300 bg-rose-50/30' : 'border-gray-200 focus:border-black'
                  }`}
                >
                  <option value="">Select a category...</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                {formErrors.category_id && (
                  <p className="mt-1 text-[11px] text-rose-600">{formErrors.category_id}</p>
                )}
              </div>

              {/* Price & Stock Row */}
              <div className="grid grid-cols-2 gap-3">
                {/* Price */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Price (PHP ₱) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs text-gray-400">₱</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={formData.price}
                      onChange={(e) => {
                        setFormData({ ...formData, price: e.target.value })
                        if (formErrors.price) setFormErrors({ ...formErrors, price: null })
                      }}
                      className={`w-full rounded-lg border pl-7 pr-3 py-2 text-xs focus:outline-hidden transition ${
                        formErrors.price ? 'border-rose-300 bg-rose-50/30' : 'border-gray-200 focus:border-black'
                      }`}
                    />
                  </div>
                  {formErrors.price && (
                    <p className="mt-1 text-[11px] text-rose-600">{formErrors.price}</p>
                  )}
                </div>

                {/* Stock */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Available Stock <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    placeholder="0"
                    value={formData.stock}
                    onChange={(e) => {
                      setFormData({ ...formData, stock: e.target.value })
                      if (formErrors.stock) setFormErrors({ ...formErrors, stock: null })
                    }}
                    className={`w-full rounded-lg border px-3 py-2 text-xs focus:outline-hidden transition ${
                      formErrors.stock ? 'border-rose-300 bg-rose-50/30' : 'border-gray-200 focus:border-black'
                    }`}
                  />
                  {formErrors.stock && (
                    <p className="mt-1 text-[11px] text-rose-600">{formErrors.stock}</p>
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  rows="3"
                  placeholder="Key features, specifications, and overview..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs focus:border-black focus:outline-hidden transition"
                />
              </div>

              {/* Image URL with preview */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Product Image URL
                </label>
                <input
                  type="text"
                  placeholder="https://example.com/product.jpg or /images/item.png"
                  value={formData.image_url}
                  onChange={(e) => {
                    setFormData({ ...formData, image_url: e.target.value })
                    if (formErrors.image_url) setFormErrors({ ...formErrors, image_url: null })
                  }}
                  className={`w-full rounded-lg border px-3 py-2 text-xs focus:outline-hidden transition ${
                    formErrors.image_url ? 'border-rose-300 bg-rose-50/30' : 'border-gray-200 focus:border-black'
                  }`}
                />
                {formErrors.image_url && (
                  <p className="mt-1 text-[11px] text-rose-600">{formErrors.image_url}</p>
                )}
                {formData.image_url && (
                  <div className="mt-2 flex items-center gap-2 rounded-lg border border-gray-100 bg-gray-50 p-2 text-xs text-gray-500">
                    <img
                      src={formData.image_url}
                      alt="Preview"
                      className="h-9 w-9 rounded object-cover border border-gray-200"
                      onError={(e) => {
                        e.target.style.display = 'none'
                      }}
                    />
                    <span className="text-[11px] truncate">Image preview active</span>
                  </div>
                )}
              </div>

              {/* Active / Inactive Toggle Switch */}
              <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-900">Active Storefront Status</p>
                  <p className="text-[11px] text-gray-500">
                    When active, customers can browse and order this item.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    formData.is_active ? 'bg-black' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formData.is_active ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Modal Buttons */}
              <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  disabled={formSubmitting}
                  onClick={() => setModalOpen(false)}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-black px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-gray-800 disabled:opacity-50"
                >
                  {formSubmitting && <RefreshCw className="h-3 w-3 animate-spin" />}
                  <span>{isEditing ? 'Save Changes' : 'Create Product'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          DELETE CONFIRMATION & DEACTIVATION MODAL
      ========================================================================= */}
      {deleteModalOpen && productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-gray-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => !deleteLoading && setDeleteModalOpen(false)}
          />

          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl transition-all">
            <div className="flex items-start gap-4">
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                  deleteReferenced ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                }`}
              >
                {deleteReferenced ? (
                  <ShieldAlert className="h-6 w-6" />
                ) : (
                  <AlertTriangle className="h-6 w-6" />
                )}
              </div>

              <div className="flex-1">
                <h3 className="text-base font-bold text-gray-900">
                  {deleteReferenced ? 'Product Cannot Be Deleted' : 'Delete Product?'}
                </h3>
                <p className="mt-1 text-xs text-gray-600">
                  {deleteReferenced ? (
                    <span>
                      <strong className="text-gray-900">"{productToDelete.name}"</strong> is referenced in existing customer orders. To preserve historical order data and referential integrity, it cannot be permanently removed.
                    </span>
                  ) : (
                    <span>
                      Are you sure you want to delete <strong className="text-gray-900">"{productToDelete.name}"</strong>? This action cannot be undone if the product has never been ordered.
                    </span>
                  )}
                </p>

                {deleteError && (
                  <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-[11px] text-amber-800">
                    {deleteError}
                  </div>
                )}
              </div>
            </div>

            {/* Actions: If referenced, offer deactivation; if not, offer both */}
            <div className="mt-6 flex flex-col gap-2 pt-4 border-t border-gray-100">
              {/* Deactivate Option Button (Preferred / Recommended) */}
              <button
                type="button"
                disabled={deleteLoading}
                onClick={handleDeactivateInstead}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-black transition disabled:opacity-50"
              >
                <EyeOff className="h-4 w-4" />
                <span>
                  {deleteReferenced ? 'Deactivate Product Instead (Recommended)' : 'Deactivate Product (Safe)'}
                </span>
              </button>

              {/* Permanent Delete Option (Only when not confirmed as referenced) */}
              {!deleteReferenced && (
                <button
                  type="button"
                  disabled={deleteLoading}
                  onClick={handleDeleteConfirm}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition disabled:opacity-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Delete Permanently</span>
                </button>
              )}

              <button
                type="button"
                disabled={deleteLoading}
                onClick={() => setDeleteModalOpen(false)}
                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

