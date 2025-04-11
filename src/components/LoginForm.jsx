"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { toast } from "./Toaster"

export default function LoginForm() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  // Google Sheet details
  const sheetId = '1tpKmn957d-nuxtKgcRGPkTh5NL2i33guyuS32l-sAEA'
  const masterSheetName = 'Master'

  const handleLogin = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Validate inputs
      if (!username || !password) {
        toast({
          title: "Error",
          description: "Please enter both username and password",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      // Fetch credentials from Master sheet
      const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(masterSheetName)}`
      
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Failed to fetch Master sheet data: ${response.status}`)
      }
      
      // Extract JSON data from the response
      const text = await response.text()
      
      const jsonStart = text.indexOf('{')
      const jsonEnd = text.lastIndexOf('}')
      
      if (jsonStart === -1 || jsonEnd === -1) {
        throw new Error("Invalid response format from Master Sheets")
      }
      
      const jsonString = text.substring(jsonStart, jsonEnd + 1)
      const data = JSON.parse(jsonString)

      // Check credentials
      let validCredentials = false
      let userRole = null
      let userName = null

      if (data.table && data.table.rows) {
        for (let i = 1; i < data.table.rows.length; i++) {
          const row = data.table.rows[i]
          
          // Check if row has sufficient columns
          if (row.c && row.c[3] && row.c[4] && row.c[5]) {
            const sheetUsername = row.c[3].v ? row.c[3].v.toString().trim() : ''
            const sheetPassword = row.c[4].v ? row.c[4].v.toString().trim() : ''
            const sheetUserType = row.c[5].v ? row.c[5].v.toString().trim() : ''
            const sheetName = row.c[0].v ? row.c[0].v.toString().trim() : 'User'

            if (sheetUsername === username && sheetPassword === password) {
              validCredentials = true
              userRole = sheetUserType.toLowerCase() === 'admin' ? 'admin' : 'user'
              userName = sheetName
              break
            }
          }
        }
      }

      if (validCredentials) {
        // Login successful
        await login({ 
          id: username, 
          username, 
          role: userRole, 
          name: userName 
        })
        
        toast({
          title: "Welcome",
          description: `You have successfully logged in as a ${userRole}`,
        })

        // Navigate based on role
        if (userRole === 'admin') {
          navigate("/ims")
        } else {
          navigate("/dashboard")
        }
      } else {
        // Invalid credentials
        toast({
          title: "Login Failed",
          description: "Invalid username or password",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Login error:", error)
      toast({
        title: "Error",
        description: "An error occurred during login",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md bg-white rounded-lg shadow-xl overflow-hidden">
      <div className="bg-purple-600 p-8 pb-6 text-center">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8 text-white"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="8" cy="15" r="4" />
            <line x1="10.85" y1="12.15" x2="19" y2="4" />
            <line x1="18" y1="5" x2="20" y2="7" />
            <line x1="15" y1="8" x2="17" y2="10" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white">Metal Inventory System</h2>
        <p className="text-white/80 mt-1">Enter your credentials to access the system</p>
      </div>

      <div className="p-6">
        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
              Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-gray-400"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <input
                id="username"
                type="text"
                placeholder="Enter your username"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-gray-400"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center py-2.5 px-4 bg-purple-600 text-white font-medium rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                <span>Logging in...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                  <polyline points="10 17 15 12 10 7" />
                  <line x1="15" y1="12" x2="3" y2="12" />
                </svg>
                <span>Sign In</span>
              </div>
            )}
          </button>
        </form>

        <p className="mt-6 text-xs text-center text-gray-500">
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  )
}