import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  FolderTree,
  Plus,
  Search,
  Edit2,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  X,
  RefreshCw,
  AlertCircle,
  Package,
  Layers,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react'
import { api } from '../../services/api'

export default function AdminCategories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [refreshing, setRefreshing] = useState(false)

  // Search filter
  const [search, setSearch] = useState('')

  // Add / Edit Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [currentCategoryId, setCurrentCategoryId] = useState(null)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  })
  const [formErrors, setFormErrors] = useState({})
  const [formSubmitting, setFormSubmitting] = useState(false)
  const [formServerError, setFormServerError] = useState(null)

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState(null)

  // Toast alert
  const [toast, setToast] = useState(null)

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  // Fetch categories from backend
  const fetchCategories = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    setError(null)

    try {
      const res = await api.get('/admin/categories')
      if (res && res.success) {
        setCategories(res.data || [])
      } else {
        setError(res?.message || 'Failed to fetch categories.')
      }
    } catch (err) {
      setError(err.message || 'Error connecting to category service.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  // Filtered categories
  const filteredCategories = useMemo(() => {
    if (!search.trim()) return categories
    const q = search.toLowerCase().trim()
    return categories.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.description && c.description.toLowerCase().includes(q))
    )
  }, [categories, search])

  // Aggregate statistics
  const stats = useMemo(() => {
    const total = categories.length
    const totalProducts = categories.reduce((sum, c) => sum + Number(c.product_count || 0), 0)
    const emptyCategories = categories.filter((c) => Number(c.product_count || 0) === 0).length
    const activeProducts = categories.reduce(
      (sum, c) => sum + Number(c.active_product_count || 0),
      0
    )
    return { total, totalProducts, emptyCategories, activeProducts }
  }, [categories])

  // Open modal for creating category
  const handleOpenAdd = () => {
    setIsEditing(false)
    setCurrentCategoryId(null)
    setFormData({ name: '', description: '' })
    setFormErrors({})
    setFormServerError(null)
    setModalOpen(true)
  }

  // Open modal for editing category
  const handleOpenEdit = (category) => {
    setIsEditing(true)
    setCurrentCategoryId(category.id)
    setFormData({
      name: category.name || '',
      description: category.description || '',
    })
    setFormErrors({})
    setFormServerError(null)
    setModalOpen(true)
  }

  // Form validation (Prevent duplicate names & empty input)
  const validateForm = () => {
    const errors = {}
    const trimmedName = formData.name.trim()

    if (!trimmedName) {
      errors.name = 'Category name is required.'
    } else if (trimmedName.length < 2) {
      errors.name = 'Category name must be at least 2 characters.'
    } else if (trimmedName.length > 100) {
      errors.name = 'Category name cannot exceed 100 characters.'
    } else {
      // Check for duplicate names on client side (case-insensitive)
      const isDuplicate = categories.some(
        (c) =>
          c.name.toLowerCase() === trimmedName.toLowerCase() &&
          (!isEditing || c.id !== currentCategoryId)
      )
      if (isDuplicate) {
        errors.name = `A category named "${trimmedName}" already exists.`
      }
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Submit Category Form (Create or Update)
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    setFormSubmitting(true)
    setFormServerError(null)

    const payload = {
      name: formData.name.trim(),
      description: formData.description.trim() || null,
    }

    try {
      if (isEditing) {
        const res = await api.put(`/admin/categories/${currentCategoryId}`, payload)
        if (res && res.success) {
          showToast(`Category "${payload.name}" updated successfully.`)
          setModalOpen(false)
          fetchCategories(true)
        } else {
          setFormServerError(res?.message || 'Failed to update category.')
        }
      } else {
        const res = await api.post('/admin/categories', payload)
        if (res && res.success) {
          showToast(`Category "${payload.name}" created successfully.`)
          setModalOpen(false)
          fetchCategories(true)
        } else {
          setFormServerError(res?.message || 'Failed to create category.')
        }
      }
    } catch (err) {
      setFormServerError(err.message || 'An unexpected error occurred.')
    } finally {
      setFormSubmitting(false)
    }
  }

  // Open delete confirmation modal
  const handleOpenDelete = (category) => {
    setCategoryToDelete(category)
    setDeleteError(null)
    setDeleteModalOpen(true)
  }

  // Confirm delete category
  const handleDeleteConfirm = async () => {
    if (!categoryToDelete) return

    // Prevent deletion if products exist
    if (Number(categoryToDelete.product_count || 0) > 0) {
      setDeleteError(
        `Cannot delete "${categoryToDelete.name}" because it contains ${categoryToDelete.product_count} product(s). Please delete or reassign them first.`
      )
      return
    }

    setDeleteLoading(true)
    setDeleteError(null)

    try {
      const res = await api.delete(`/admin/categories/${categoryToDelete.id}`)
      if (res && res.success) {
        showToast(`Category "${categoryToDelete.name}" deleted successfully.`)
        setDeleteModalOpen(false)
        fetchCategories(true)
      } else {
        setDeleteError(res?.message || 'Failed to delete category.')
      }
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete category.')
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Toast Alert */}
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

      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Category Management</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Organize products into departments, manage catalog taxonomies, and control storefront filtering.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchCategories(true)}
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
            <span>Add Category</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-2xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Total Categories</span>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
          <span className="text-xs text-gray-500">Catalog sections</span>
        </div>

        <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-4 shadow-2xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-600">Assigned Products</span>
          <p className="text-2xl font-bold text-blue-700 mt-1">{stats.totalProducts}</p>
          <span className="text-xs text-blue-600/80">Across all categories</span>
        </div>

        <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-4 shadow-2xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600">Active Products</span>
          <p className="text-2xl font-bold text-emerald-700 mt-1">{stats.activeProducts}</p>
          <span className="text-xs text-emerald-600/80">Storefront visible</span>
        </div>

        <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4 shadow-2xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Empty Categories</span>
          <p className="text-2xl font-bold text-gray-700 mt-1">{stats.emptyCategories}</p>
          <span className="text-xs text-gray-400">Safe for deletion</span>
        </div>
      </div>

      {/* Search Toolbar */}
      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-2xs">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search categories by name or description..."
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
      </div>

      {/* Main Categories Table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-2xs overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-500">
            <RefreshCw className="h-8 w-8 animate-spin text-gray-400 mb-3" />
            <p className="text-sm font-medium">Loading categories...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-700 bg-rose-50/50">
            <AlertCircle className="h-8 w-8 mx-auto text-rose-500 mb-2" />
            <p className="font-semibold text-sm">{error}</p>
            <button
              onClick={() => fetchCategories(true)}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700"
            >
              <RefreshCw className="h-3 w-3" /> Retry
            </button>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="py-20 text-center text-gray-500">
            <FolderTree className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-base font-bold text-gray-700">No categories found</p>
            <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
              {search
                ? 'No categories match your search keyword.'
                : 'Get started by clicking "Add Category" to create your first product category.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[640px]">
              <thead className="bg-gray-50/75 border-b border-gray-100 text-gray-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-6 py-3.5">Category Name</th>
                  <th className="px-6 py-3.5">Description</th>
                  <th className="px-6 py-3.5">Products Assigned</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {filteredCategories.map((category) => {
                  const prodCount = Number(category.product_count || 0)
                  const hasProducts = prodCount > 0

                  return (
                    <tr key={category.id} className="hover:bg-gray-50/50 transition">
                      {/* Name & Icon */}
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-700">
                            <FolderTree className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 text-xs">{category.name}</p>
                            <span className="text-[10px] text-gray-400">ID: #{category.id}</span>
                          </div>
                        </div>
                      </td>

                      {/* Description */}
                      <td className="px-6 py-3.5 max-w-xs">
                        <p className="text-gray-600 line-clamp-2">
                          {category.description || <span className="italic text-gray-400">No description provided</span>}
                        </p>
                      </td>

                      {/* Assigned Products Count */}
                      <td className="px-6 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-bold ${
                              hasProducts
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : 'bg-gray-100 text-gray-500'
                            }`}
                          >
                            <Package className="h-3 w-3" />
                            <span>{prodCount} product{prodCount !== 1 ? 's' : ''}</span>
                          </span>

                          {hasProducts && (
                            <Link
                              to={`/admin/products`}
                              title="View assigned products"
                              className="text-gray-400 hover:text-blue-600"
                            >
                              <ArrowRight className="h-3 w-3" />
                            </Link>
                          )}
                        </div>
                      </td>

                      {/* Integrity / Deletion Status */}
                      <td className="px-6 py-3.5 whitespace-nowrap">
                        {hasProducts ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-2 py-0.5">
                            <AlertTriangle className="h-3 w-3" />
                            <span>Deletion Protected</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-md px-2 py-0.5">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>Safe to delete</span>
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-3.5 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(category)}
                            title="Edit Category"
                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>

                          <button
                            onClick={() => handleOpenDelete(category)}
                            title="Delete Category"
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
          ADD / EDIT CATEGORY MODAL
      ========================================================================= */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-gray-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => !formSubmitting && setModalOpen(false)}
          />

          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl transition-all">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  {isEditing ? 'Edit Category' : 'Add New Category'}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {isEditing
                    ? 'Update the category name and descriptive text.'
                    : 'Create a new category for products in your store.'}
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
              {/* Category Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Category Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., Audio & Headphones"
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

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  rows="3"
                  placeholder="Describe the types of items in this category..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs focus:border-black focus:outline-hidden transition"
                />
              </div>

              {/* Action Buttons */}
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
                  <span>{isEditing ? 'Save Changes' : 'Create Category'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          DELETE CONFIRMATION & INTEGRITY MODAL
      ========================================================================= */}
      {deleteModalOpen && categoryToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-gray-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => !deleteLoading && setDeleteModalOpen(false)}
          />

          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl transition-all">
            <div className="flex items-start gap-4">
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                  Number(categoryToDelete.product_count || 0) > 0
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-rose-100 text-rose-700'
                }`}
              >
                {Number(categoryToDelete.product_count || 0) > 0 ? (
                  <ShieldAlert className="h-6 w-6" />
                ) : (
                  <AlertTriangle className="h-6 w-6" />
                )}
              </div>

              <div className="flex-1">
                <h3 className="text-base font-bold text-gray-900">
                  {Number(categoryToDelete.product_count || 0) > 0
                    ? 'Cannot Delete Category'
                    : 'Delete Category?'}
                </h3>

                {Number(categoryToDelete.product_count || 0) > 0 ? (
                  <div className="mt-2 space-y-2 text-xs text-gray-600">
                    <p>
                      Category <strong className="text-gray-900">"{categoryToDelete.name}"</strong> cannot be deleted because it currently has <strong className="text-gray-900">{categoryToDelete.product_count} product(s)</strong> assigned to it.
                    </p>
                    <p className="text-gray-500">
                      To preserve database integrity and ensure catalog products remain accessible, you must delete or reassign all assigned products before removing this category.
                    </p>
                  </div>
                ) : (
                  <p className="mt-1 text-xs text-gray-600">
                    Are you sure you want to permanently delete category <strong className="text-gray-900">"{categoryToDelete.name}"</strong>? Since it has no assigned products, it can be safely removed.
                  </p>
                )}

                {deleteError && (
                  <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-[11px] text-rose-800">
                    {deleteError}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                disabled={deleteLoading}
                onClick={() => setDeleteModalOpen(false)}
                className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50"
              >
                {Number(categoryToDelete.product_count || 0) > 0 ? 'Close' : 'Cancel'}
              </button>

              {Number(categoryToDelete.product_count || 0) > 0 ? (
                <Link
                  to="/admin/products"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-black px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-gray-800"
                >
                  <Package className="h-3.5 w-3.5" />
                  <span>Manage Products</span>
                </Link>
              ) : (
                <button
                  type="button"
                  disabled={deleteLoading}
                  onClick={handleDeleteConfirm}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-rose-700 disabled:opacity-50"
                >
                  {deleteLoading && <RefreshCw className="h-3 w-3 animate-spin" />}
                  <span>Delete Permanently</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

