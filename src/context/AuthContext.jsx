import { createContext, useContext, useState } from 'react'
import { login as apiLogin } from '../api/auth'

const AuthContext = createContext(null)

function parseUsername(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.sub ?? null
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token'))

  const user = token ? parseUsername(token) : null
  const isAuthenticated = !!token

  async function login(username, password) {
    const response = await apiLogin(username, password)
    const receivedToken = response.data.token
    localStorage.setItem('token', receivedToken)
    setToken(receivedToken)
  }

  function logout() {
    localStorage.removeItem('token')
    setToken(null)
    window.location.href = '/login'
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
