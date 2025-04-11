"use client"
import PropTypes from 'prop-types'
import { Navigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"

export default function AdminRoute({ children }) {
  const { user, isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
        <span className="ml-4 text-purple-600">Loading...</span>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />
  }

  if (user?.role !== "admin") {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

AdminRoute.propTypes = {
  children: PropTypes.node.isRequired
}