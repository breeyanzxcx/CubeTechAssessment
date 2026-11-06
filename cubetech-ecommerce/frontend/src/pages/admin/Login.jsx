import { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { ShieldCheck, AlertCircle, ArrowLeft } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

function AdminLogin() {
  const { login, user, isAdmin } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const from = location.state?.from?.pathname || '/admin/orders'

  // If already authenticated as admin, redirect to admin destination
  useEffect(() => {
    if (isAdmin) {
      navigate(from, { replace: true })
    }
  }, [isAdmin, navigate, from])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await login({ email, password })

      if (response && response.success) {
        if (response.data?.role !== 'admin') {
          setError('Access denied: this account does not have administrator privileges.')
          return
        }
        navigate(from, { replace: true })
      } else {
        throw new Error(response?.message || 'Login failed.')
      }
    } catch (err) {
      setError(err.message || 'Invalid administrator email or password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-xs text-left">
        <Link
          to="/products"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-black mb-6 transition"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Store</span>
        </Link>

        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-black text-white shadow-xs">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">
            CubeTech Admin
          </h1>
          <p className="mt-1.5 text-xs text-gray-500">
            Sign in with administrative credentials to access the management portal.
          </p>
        </div>

        {error && (
          <div className="mb-5 flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs font-medium text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm outline-none focus:border-black transition"
              placeholder="admin@cubetech.com"
              disabled={loading}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm outline-none focus:border-black transition"
              placeholder="••••••••"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-lg bg-black px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-400 shadow-xs"
          >
            {loading ? 'Authenticating...' : 'Sign In to Portal'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default AdminLogin
