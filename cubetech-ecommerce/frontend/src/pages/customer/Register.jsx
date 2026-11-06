import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { UserPlus, AlertCircle, ShoppingBag, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

function CustomerRegister() {
  const { register, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const from = location.state?.from?.pathname || '/products'

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setError('')
  }

  const validate = () => {
    if (!formData.name.trim()) {
      return 'Full name is required.'
    }
    if (!formData.email.trim()) {
      return 'Email address is required.'
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      return 'Please enter a valid email address.'
    }
    if (formData.password.length < 8) {
      return 'Password must be at least 8 characters long.'
    }
    if (formData.password !== formData.confirmPassword) {
      return 'Passwords do not match.'
    }
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)

    try {
      const regResponse = await register({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
      })

      if (regResponse && regResponse.success) {
        setSuccess(true)

        // Automatically log the customer in
        try {
          await login({
            email: formData.email.trim(),
            password: formData.password,
          })
          setTimeout(() => {
            navigate(from, { replace: true })
          }, 800)
        } catch {
          // If auto-login fails, redirect to login page
          navigate('/login', {
            state: { message: 'Account created! Please sign in with your credentials.' },
            replace: true,
          })
        }
      } else {
        throw new Error(regResponse?.message || 'Registration failed.')
      }
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="mx-auto max-w-md px-6 py-12 text-left">
      <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-xs">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-black text-white shadow-xs">
            <ShoppingBag className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Create an Account
          </h1>
          <p className="mt-1.5 text-xs text-gray-500">
            Join CubeTech to checkout easily and track your orders.
          </p>
        </div>

        {success ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center space-y-3">
            <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />
            <h3 className="text-base font-bold text-emerald-900">Account Created!</h3>
            <p className="text-xs text-emerald-700">Signing you in automatically...</p>
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-5 flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs font-medium text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm outline-none focus:border-black transition"
                  placeholder="Juan dela Cruz"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm outline-none focus:border-black transition"
                  placeholder="juan@email.com"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Password * (min. 8 characters)
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm outline-none focus:border-black transition"
                  placeholder="••••••••"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Confirm Password *
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm outline-none focus:border-black transition"
                  placeholder="••••••••"
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full rounded-lg bg-black px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-400 shadow-xs flex items-center justify-center gap-2"
              >
                <UserPlus className="h-4 w-4" />
                <span>{loading ? 'Creating Account...' : 'Sign Up'}</span>
              </button>
            </form>
          </>
        )}

        <div className="mt-6 border-t border-gray-100 pt-6 text-center text-xs text-gray-500">
          Already have an account?{' '}
          <Link
            to="/login"
            state={{ from: location.state?.from }}
            className="font-bold text-black hover:underline"
          >
            Sign in
          </Link>
        </div>
      </div>
    </main>
  )
}

export default CustomerRegister

