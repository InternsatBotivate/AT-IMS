"use client"

import { useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { getTransactionsByParty, getPartyMetalBalances } from "../data/metalData"
import DashboardHeader from "../components/DashboardHeader"
import { useAuth } from "../contexts/AuthContext"

export default function PartyDetailsPage() {
  const navigate = useNavigate()
  const params = useParams()
  const { isAuthenticated } = useAuth()

  const partyName = decodeURIComponent(params.party)
  const transactions = getTransactionsByParty(partyName)
  const allPartyBalances = getPartyMetalBalances()
  const partyBalance = allPartyBalances.find((p) => p.party === partyName)

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/")
    }
  }, [isAuthenticated, navigate])

  if (!isAuthenticated) {
    return null
  }

  // Format date string to a readable format
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-cyan-50">
      <DashboardHeader />
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center mb-6">
          <button className="btn btn-ghost mr-4" onClick={() => navigate(-1)}>
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
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            Back
          </button>
          <h1 className="text-3xl font-bold text-indigo-800">{partyName}</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {["Gold", "Diamond", "Silver", "Platinum"].map((metal) => {
            const metalLower = metal.toLowerCase()
            const dr = partyBalance?.[`${metalLower}Dr`] || 0
            const cr = partyBalance?.[`${metalLower}Cr`] || 0
            const balance = cr - dr

            return (
              <div key={metal} className={`card border-2 ${balance < 0 ? "border-red-200" : "border-green-200"}`}>
                <div className={`card-header pb-2 ${balance < 0 ? "bg-red-50" : "bg-green-50"}`}>
                  <h3 className="text-lg font-bold">{metal} Balance</h3>
                </div>
                <div className="card-content pt-4">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-xs text-gray-500">DR (Issued)</p>
                      <p className="text-lg font-bold text-red-600">{dr.toFixed(1)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">CR (Received)</p>
                      <p className="text-lg font-bold text-green-600">{cr.toFixed(1)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Balance</p>
                      <p className={`text-lg font-bold ${balance < 0 ? "text-red-600" : "text-green-600"}`}>
                        {balance.toFixed(1)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 text-center">
                    {balance < 0 ? (
                      <span className="badge badge-destructive">TO RECEIVE {Math.abs(balance).toFixed(1)} GM</span>
                    ) : balance > 0 ? (
                      <span className="badge badge-outline border-green-500 bg-green-100 text-green-800">
                        HAS {balance.toFixed(1)} GM
                      </span>
                    ) : (
                      <span className="badge badge-outline">BALANCED</span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="card border-2 border-indigo-200">
          <div className="card-header bg-gradient-to-r from-indigo-500 to-purple-500 text-white pb-2">
            <h3 className="text-lg font-bold">Transaction History</h3>
          </div>
          <div className="card-content p-0">
            <div className="overflow-x-auto">
              <table className="table w-full">
                <thead className="bg-indigo-50">
                  <tr>
                    <th className="text-indigo-700 p-3">Date</th>
                    <th className="text-indigo-700 p-3">Type</th>
                    <th className="text-indigo-700 p-3">Other Party</th>
                    <th className="text-indigo-700 p-3">Voucher No.</th>
                    <th className="text-indigo-700 p-3">Metal Type</th>
                    <th className="text-indigo-700 p-3 text-right">Weight (g)</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.length > 0 ? (
                    transactions.map((transaction) => {
                      const isFrom = transaction.from === partyName
                      const otherParty = isFrom ? transaction.to : transaction.from

                      return (
                        <tr key={transaction.id} className="hover:bg-indigo-50/50 border-b">
                          <td className="p-3 font-medium">{formatDate(transaction.date)}</td>
                          <td className="p-3">
                            <span
                              className={`badge ${isFrom ? "badge-destructive" : "badge-success"} flex items-center gap-1`}
                            >
                              {isFrom ? (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-3 w-3"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <line x1="12" y1="5" x2="12" y2="19" />
                                  <polyline points="19 12 12 19 5 12" />
                                </svg>
                              ) : (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-3 w-3"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <line x1="12" y1="19" x2="12" y2="5" />
                                  <polyline points="5 12 12 5 19 12" />
                                </svg>
                              )}
                              {isFrom ? "Issued" : "Received"}
                            </span>
                          </td>
                          <td className="p-3">{otherParty}</td>
                          <td className="p-3">{transaction.voucherNo}</td>
                          <td className="p-3">
                            <span
                              className={`badge badge-outline ${
                                transaction.metalType === "Gold"
                                  ? "border-yellow-500 bg-yellow-100 text-yellow-800"
                                  : transaction.metalType === "Diamond"
                                    ? "border-purple-500 bg-purple-100 text-purple-800"
                                    : transaction.metalType === "Silver"
                                      ? "border-gray-500 bg-gray-100 text-gray-800"
                                      : "border-blue-500 bg-blue-100 text-blue-800"
                              }`}
                            >
                              {transaction.metalType}
                            </span>
                          </td>
                          <td className="p-3 text-right font-medium">{transaction.weight.toFixed(1)}</td>
                        </tr>
                      )
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-gray-500">
                        No transactions found for this party.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
