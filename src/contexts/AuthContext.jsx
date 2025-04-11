"use client"

import { createContext, useContext, useEffect, useState } from "react"
import PropTypes from 'prop-types'

// Create context with default values
const AuthContext = createContext({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  logout: () => {},
})

// Auth provider component
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Check for existing session on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser)
        // Validate stored user data
        if (parsedUser && parsedUser.username && parsedUser.role) {
          setUser(parsedUser)
          setIsAuthenticated(true)
        } else {
          throw new Error("Invalid user data")
        }
      } catch (error) {
        console.error("Failed to parse stored user:", error)
        localStorage.removeItem("user")
      }
    }
    setIsLoading(false)
  }, [])

  // Login function
  const login = async (userData) => {
    return new Promise((resolve) => {
      // Validate user data before storing
      if (!userData.username || !userData.role) {
        throw new Error("Invalid user data")
      }

      // Simulate API delay
      setTimeout(() => {
        setUser(userData)
        setIsAuthenticated(true)
        localStorage.setItem("user", JSON.stringify(userData))
        resolve()
      }, 1000)
    })
  }

  // Logout function
  const logout = () => {
    setUser(null)
    setIsAuthenticated(false)
    localStorage.removeItem("user")
  }

  // Provide auth context to children
  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// PropTypes for type checking
AuthProvider.propTypes = {
  children: PropTypes.node.isRequired
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext)
  
  // Optional: Add a check to ensure the hook is used within an AuthProvider
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  
  return context
}