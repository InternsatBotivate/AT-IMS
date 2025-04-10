"use client"

import { useState, useEffect } from "react"

export default function BalanceView() {
  const [searchTerm, setSearchTerm] = useState("")
  const [balances, setBalances] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // Google Sheet details
  const sheetId = '1tpKmn957d-nuxtKgcRGPkTh5NL2i33guyuS32l-sAEA'
  const entriesSheetName = 'Entries'

  // Calculate metal balances
  const calculateMetalBalances = async () => {
    try {
      // Fetch Entries sheet data
      const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(entriesSheetName)}`
      
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Failed to fetch Entries data: ${response.status}`)
      }
      
      // Extract JSON data from the response
      const text = await response.text()
      
      const jsonStart = text.indexOf('{')
      const jsonEnd = text.lastIndexOf('}')
      
      if (jsonStart === -1 || jsonEnd === -1) {
        throw new Error("Invalid response format from Entries Sheets")
      }
      
      const jsonString = text.substring(jsonStart, jsonEnd + 1)
      const data = JSON.parse(jsonString)
      
      // Extract unique metal types
      const uniqueMetalTypes = new Set()
      const metalBalances = {}
      
      // Process rows
      if (data.table && data.table.rows) {
        for (let i = 0; i < data.table.rows.length; i++) {
          const row = data.table.rows[i]
          
          // Skip empty rows
          if (!row.c || !row.c[5]) continue
          
          // Extract metal type from column F (index 5)
          const metalType = row.c[5] ? (row.c[5].v || '').toString().trim() : ''
          
          // Extract transaction type from column D (index 3)
          const transactionType = row.c[3] ? (row.c[3].v || '').toString().trim() : ''
          
          // Extract value from column G (index 6)
          const value = row.c[6] ? Number(row.c[6].v || 0) : 0
          
          if (!metalType) continue
          
          // Add to unique metal types
          uniqueMetalTypes.add(metalType)
          
          // Initialize balance if not exists
          if (!metalBalances[metalType]) {
            metalBalances[metalType] = {
              issuedQty: 0,
              receiptQty: 0
            }
          }
          
          // Calculate issued quantity
          if (transactionType.toLowerCase() === 'issue') {
            metalBalances[metalType].issuedQty += value
          }
          
          // Calculate receipt quantity
          if (transactionType.toLowerCase() === 'receipt') {
            metalBalances[metalType].receiptQty += value
          }
        }
      }
      
      // Convert to array and calculate balance quantity
      const calculatedBalances = Array.from(uniqueMetalTypes).map(metalType => ({
        metalType,
        issuedQty: metalBalances[metalType].issuedQty,
        receiptQty: metalBalances[metalType].receiptQty,
        balanceQty: metalBalances[metalType].issuedQty - metalBalances[metalType].receiptQty
      }))
      
      return calculatedBalances
    } catch (error) {
      console.error("Error calculating metal balances:", error)
      throw error
    }
  }

  // Fetch balances on component mount
  useEffect(() => {
    const fetchBalances = async () => {
      try {
        setIsLoading(true)
        const calculatedBalances = await calculateMetalBalances()
        setBalances(calculatedBalances)
      } catch (error) {
        setError("Failed to load metal balances")
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchBalances()
  }, [])

  // Filter balances based on search term
  const filteredBalances = balances.filter((balance) =>
    balance.metalType.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div>
      <div className="p-4 bg-gradient-to-r from-purple-100 to-pink-100">
        <div className="relative">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="absolute left-3 top-3 h-4 w-4 text-gray-500"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            placeholder="Search by metal type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-9 border-purple-200 focus:border-purple-400"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-2 text-purple-600">Loading metal balances...</span>
        </div>
      ) : error ? (
        <div className="text-center py-8 text-red-500">{error}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead className="bg-purple-50">
              <tr>
                <th className="text-purple-700 p-3">Metal Type</th>
                <th className="text-purple-700 p-3 text-right">Issue Qty (g)</th>
                <th className="text-purple-700 p-3 text-right">Receipt Qty (g)</th>
                <th className="text-purple-700 p-3 text-right">Balance Qty (g)</th>
                <th className="text-purple-700 p-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredBalances.length > 0 ? (
                filteredBalances.map((balance) => (
                  <tr key={balance.metalType} className="hover:bg-purple-50/50 border-b">
                    <td className="p-3">
                      <span
                        className={`badge badge-outline ${
                          balance.metalType === "Gold"
                            ? "border-yellow-500 bg-yellow-100 text-yellow-800"
                            : balance.metalType === "Diamond"
                              ? "border-purple-500 bg-purple-100 text-purple-800"
                              : balance.metalType === "Silver"
                                ? "border-gray-500 bg-gray-100 text-gray-800"
                                : "border-blue-500 bg-blue-100 text-blue-800"
                        }`}
                      >
                        {balance.metalType}
                      </span>
                    </td>
                    <td className="p-3 text-right font-medium text-red-600">{balance.issuedQty.toFixed(2)}</td>
                    <td className="p-3 text-right font-medium text-green-600">{balance.receiptQty.toFixed(2)}</td>
                    <td className="p-3 text-right font-bold">{balance.balanceQty.toFixed(2)}</td>
                    <td className="p-3 text-center">
                      <span
                        className={`badge ${
                          balance.balanceQty > 0
                            ? balance.balanceQty > 100
                              ? "badge-outline border-green-500 bg-green-100 text-green-800"
                              : "badge-outline border-yellow-500 bg-yellow-100 text-yellow-800"
                            : "badge-destructive"
                        }`}
                      >
                        {balance.balanceQty > 100 ? "Good Stock" : balance.balanceQty > 0 ? "Low Stock" : "Out of Stock"}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-500">
                    No metal types found. Try a different search or add new transactions.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}