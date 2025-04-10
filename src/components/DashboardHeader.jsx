"use client"

import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { getPartyMetalBalances } from "../data/metalData"

export default function DashboardHeader() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const parties = getPartyMetalBalances()

  const handleLogout = () => {
    logout()
    navigate("/")
  }

  // Get top 5 parties with non-zero balances
  const topParties = parties
    .filter((p) => {
      const totalBalance =
        p.goldCr - p.goldDr + (p.diamondCr - p.diamondDr) + (p.silverCr - p.silverDr) + (p.platinumCr - p.platinumDr)
      return totalBalance !== 0
    })
    .slice(0, 5)

  const [partiesDropdownOpen, setPartiesDropdownOpen] = useState(false)
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="border-b bg-white shadow-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo Section */}
        <div className="flex items-center gap-2">
          <Link to={user?.role === "admin" ? "/ims" : "/dashboard"} className="flex items-center">
            <div className="bg-purple-600 text-white p-2 rounded-md mr-2">
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
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </svg>
            </div>
            <span className="text-xl font-bold text-purple-600">MetalTrack</span>
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button 
          className="md:hidden flex items-center justify-center h-10 w-10 rounded-full bg-gray-100 text-gray-700"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
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
            {mobileMenuOpen ? (
              <>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </>
            ) : (
              <>
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </>
            )}
          </svg>
        </button>

        {/* Navigation Items - Desktop */}
        <nav className="hidden md:flex items-center gap-6">
          <Link to="/ims" className="flex items-center text-gray-700 hover:text-purple-700">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
            Ledger
          </Link>

          <Link to="/dashboard" className="flex items-center text-gray-700 hover:text-purple-700">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="16" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
            New Entry
          </Link>

          <div className="relative">
            <button
              className="flex items-center text-gray-700 hover:text-purple-700"
              onClick={() => setPartiesDropdownOpen(!partiesDropdownOpen)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              Parties
            </button>
            {partiesDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                <div className="py-1">
                  <div className="px-4 py-2 text-sm text-gray-500">Quick Access</div>
                  <div className="border-t border-gray-100"></div>
                  {topParties.map((party) => (
                    <div
                      key={party.party}
                      className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer flex items-center justify-between"
                      onClick={() => {
                        navigate(`/party-details/${encodeURIComponent(party.party)}`)
                        setPartiesDropdownOpen(false)
                      }}
                    >
                      <span>{party.party}</span>
                      {party.goldCr - party.goldDr !== 0 && (
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            party.goldCr - party.goldDr < 0 ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"
                          }`}
                        >
                          Gold: {(party.goldCr - party.goldDr).toFixed(1)}
                        </span>
                      )}
                    </div>
                  ))}
                  <div className="border-t border-gray-100"></div>
                  <div
                    className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                    onClick={() => {
                      navigate("/ims")
                      setPartiesDropdownOpen(false)
                    }}
                  >
                    View All Parties
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="relative">
            <button
              className="flex items-center justify-center h-8 w-8 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200"
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
            >
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
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </button>
            {userDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                <div className="py-1">
                  <div className="px-4 py-2 text-sm text-gray-500">My Account</div>
                  <div className="border-t border-gray-100"></div>
                  <div className="px-4 py-2 text-sm text-gray-700 flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-2"
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
                    <div className="flex flex-col">
                      <span>{user?.name}</span>
                      <span className="text-xs text-gray-500 capitalize">{user?.role}</span>
                    </div>
                  </div>
                  <div className="border-t border-gray-100"></div>
                  <div
                    className="px-4 py-2 text-sm text-red-600 hover:bg-gray-100 cursor-pointer flex items-center"
                    onClick={() => {
                      handleLogout()
                      setUserDropdownOpen(false)
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-2"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    Logout
                  </div>
                </div>
              </div>
            )}
          </div>
        </nav>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-white pt-16 px-4 pb-4 overflow-y-auto">
          <div className="flex flex-col space-y-4">
            <Link 
              to="/ims" 
              className="flex items-center p-3 rounded-md hover:bg-purple-50 text-gray-700"
              onClick={() => setMobileMenuOpen(false)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-3"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </svg>
              Ledger
            </Link>

            <Link 
              to="/dashboard" 
              className="flex items-center p-3 rounded-md hover:bg-purple-50 text-gray-700"
              onClick={() => setMobileMenuOpen(false)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-3"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="16" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
              New Entry
            </Link>

            <div className="border-t border-gray-100 my-2"></div>
            
            <div className="p-3">
              <h3 className="font-medium text-gray-900 mb-2">Quick Access Parties</h3>
              <div className="space-y-2">
                {topParties.map((party) => (
                  <div
                    key={party.party}
                    className="p-2 rounded-md hover:bg-purple-50 cursor-pointer"
                    onClick={() => {
                      navigate(`/party-details/${encodeURIComponent(party.party)}`)
                      setMobileMenuOpen(false)
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm">{party.party}</span>
                      {party.goldCr - party.goldDr !== 0 && (
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            party.goldCr - party.goldDr < 0 ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"
                          }`}
                        >
                          Gold: {(party.goldCr - party.goldDr).toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                <div
                  className="p-2 rounded-md hover:bg-purple-50 cursor-pointer text-purple-600 font-medium text-sm"
                  onClick={() => {
                    navigate("/ims")
                    setMobileMenuOpen(false)
                  }}
                >
                  View All Parties
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100 my-2"></div>
            
            <div className="p-3">
              <div className="flex items-center mb-4">
                <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center mr-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-purple-600"
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
                <div>
                  <div className="font-medium">{user?.name}</div>
                  <div className="text-xs text-gray-500 capitalize">{user?.role}</div>
                </div>
              </div>
              <button
                onClick={() => {
                  handleLogout()
                  setMobileMenuOpen(false)
                }}
                className="w-full flex items-center justify-center p-2 rounded-md bg-red-50 text-red-600 hover:bg-red-100"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-2"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
