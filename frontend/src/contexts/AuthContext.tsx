import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { authApi, User } from '@/services/api'

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, firstName?: string, lastName?: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Initialize auth state from localStorage
  useEffect(() => {
    const initAuth = async () => {
      const storedUser = localStorage.getItem('user')
      const token = localStorage.getItem('accessToken')

      if (storedUser && token) {
        try {
          setUser(JSON.parse(storedUser))
        } catch (error) {
          console.error('Failed to parse stored user:', error)
          localStorage.removeItem('user')
          localStorage.removeItem('accessToken')
          localStorage.removeItem('refreshToken')
        }
      }
      setIsLoading(false)
    }

    initAuth()

    // Listen for storage changes (e.g., from other tabs or E2E tests)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'user' || e.key === 'accessToken') {
        const storedUser = localStorage.getItem('user')
        const token = localStorage.getItem('accessToken')

        if (storedUser && token) {
          try {
            setUser(JSON.parse(storedUser))
          } catch (error) {
            console.error('Failed to sync user from storage:', error)
          }
        } else {
          setUser(null)
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const response = await authApi.login({ email, password })

      // Store auth data
      localStorage.setItem('accessToken', response.accessToken)
      localStorage.setItem('refreshToken', response.refreshToken)
      localStorage.setItem('user', JSON.stringify(response.user))

      setUser(response.user)
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Login failed')
    }
  }

  const signup = async (email: string, password: string, firstName?: string, lastName?: string) => {
    try {
      const response = await authApi.signup({ email, password, firstName, lastName })

      // Store auth data
      localStorage.setItem('accessToken', response.accessToken)
      localStorage.setItem('refreshToken', response.refreshToken)
      localStorage.setItem('user', JSON.stringify(response.user))

      setUser(response.user)
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Signup failed')
    }
  }

  const logout = async () => {
    await authApi.logout()
    setUser(null)
    // Clear localStorage tokens
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    localStorage.removeItem('csrfToken')
  }

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    signup,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
