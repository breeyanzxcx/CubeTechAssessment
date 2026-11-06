import { createContext, useContext, useEffect, useState } from 'react'
import { api } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await api.get('/admin/me')
        setAdmin(response.data)
      } catch {
        setAdmin(null)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  const login = async (credentials) => {
    const response = await api.post('/admin/login', credentials)
    setAdmin(response.data)
    return response
  }

  const logout = async () => {
    await api.post('/admin/logout', {})
    setAdmin(null)
  }

  return (
    <AuthContext.Provider
      value={{
        admin,
        loading,
        login,
        logout,
        isAuthenticated: Boolean(admin),
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}