"use client"

import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import LoginForm from "../components/LoginForm"
import { useAuth } from "../contexts/AuthContext"

export default function LoginPage() {
  const { isAuthenticated, user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (isAuthenticated) {
      if (user?.role === "admin") {
        navigate("/ims")
      } else {
        navigate("/dashboard")
      }
    }
  }, [isAuthenticated, navigate, user])

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <LoginForm />
      </div>
    </div>
  )
}
