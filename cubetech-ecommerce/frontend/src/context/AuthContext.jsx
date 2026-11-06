import { createContext, useContext, useEffect, useState } from 'react'
import { api } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const checkAuth = async () => {
    try {
      const response = await api.get('/auth/me')
      if (response && response.success && response.data) {
        setUser(response.data)
      } else {
        setUser(null)
      }
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkAuth()
  }, [])

  const login = async (credentials) => {
    const response = await api.post('/auth/login', credentials)
    if (response && response.success && response.data) {
      setUser(response.data)
    }
    return response
  }

  const register = async (details) => {
    const response = await api.post('/auth/register', details)
    return response
  }

  const logout = async () => {
    try {
      await api.post('/auth/logout', {})
    } catch {
      // Ignored
    } finally {
      setUser(null)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        admin: user?.role === 'admin' ? user : null, // backward compatibility
        loading,
        login,
        register,
        logout,
        checkAuth,
        isAuthenticated: Boolean(user),
        isAdmin: user?.role === 'admin',
        isCustomer: user?.role === 'customer',
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
