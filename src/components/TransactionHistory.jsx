"use client"

import { useState, useEffect } from "react"

export default function TransactionHistory() {
  const [searchTerm, setSearchTerm] = useState("")
  const [transactions, setTransactions] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // Google Sheet details
  const sheetId = '1tpKmn957d-nuxtKgcRGPkTh5NL2i33guyuS32l-sAEA'
  const entriesSheetName = 'Entries'

  // Fetch transactions from Entries sheet
  const getTransactions = async () => {
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
      
      // Process rows
      const fetchedTransactions = []
      
      if (data.table && data.table.rows) {
        for (let i = 1; i < data.table.rows.length; i++) {
          const row = data.table.rows[i]
          
          // Skip empty rows
          if (!row.c || !row.c[0]) continue
          
          // Extract transaction details
          const transaction = {
            id: i, // Use row index as unique identifier
            date: row.c[0] ? (row.c[0].v || '').toString() : '', // Date column
            from: row.c[1] ? (row.c[1].v || '').toString().trim() : '', // From column
            to: row.c[2] ? (row.c[2].v || '').toString().trim() : '', // To column
            voucherType: row.c[3] ? (row.c[3].v || '').toString().trim() : '', // Voucher Type column
            voucherNo: row.c[4] ? (row.c[4].v || '').toString().trim() : '', // Voucher No column
            metalType: row.c[5] ? (row.c[5].v || '').toString().trim() : '', // Metal Type column
            weight: row.c[6] ? Number(row.c[6].v || 0) : 0 // Weight column
          }
          
          fetchedTransactions.push(transaction)
        }
      }
      
      return fetchedTransactions
    } catch (error) {
      console.error("Error fetching transactions:", error)
      throw error
    }
  }

  // Fetch transactions on component mount
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setIsLoading(true)
        const fetchedTransactions = await getTransactions()
        setTransactions(fetchedTransactions)
      } catch (error) {
        setError("Failed to load transactions")
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchTransactions()
  }, [])

  // Format date string to match the sheet's format
 // Format date string to match the sheet's format
const formatDate = (dateString) => {
  // Check if the date is in the format Date(YYYY,MM,DD)
  const dateConstructorMatch = dateString.match(/Date\((\d{4}),(\d{1,2}),(\d{1,2})\)/)
  
  if (dateConstructorMatch) {
    const [, year, month, day] = dateConstructorMatch
    // Note: JavaScript months are 0-indexed, so we need to add 1
    const formattedDay = day.padStart(2, '0')
    const formattedMonth = (parseInt(month) + 1).toString().padStart(2, '0')
    
    return `${formattedDay}/${formattedMonth}/${year}`
  }
  
  // If already in DD/MM/YYYY format, return as is
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
    return dateString
  }
  
  // Try parsing the date
  const date = new Date(dateString)
  
  // Check if the date is valid
  if (isNaN(date.getTime())) {
    console.error("Could not parse date:", dateString)
    return 'Invalid Date'
  }
  
  // Format to DD/MM/YYYY
  const day = date.getDate().toString().padStart(2, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const year = date.getFullYear()
  
  return `${day}/${month}/${year}`
}

  // Filter transactions based on search term
  const filteredTransactions = transactions.filter(
    (transaction) =>
      transaction.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.to.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.voucherNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.metalType.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="p-4">
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="bg-indigo-600 text-white p-4">
          <h2 className="text-xl font-bold">Transaction History</h2>
        </div>
        
        <div className="p-4 bg-gray-50 border-b">
          <div className="relative">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="absolute left-3 top-3 h-5 w-5 text-gray-400"
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
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="ml-4 text-indigo-600 text-lg">Loading transactions...</span>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-500 text-lg">{error}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">From</th>
                  <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">To</th>
                  <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Voucher Type</th>
                  <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Voucher No.</th>
                  <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Metal Type</th>
                  <th className="p-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Weight (g)</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTransactions.length > 0 ? (
                  filteredTransactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50">
                      <td className="p-3 whitespace-nowrap">{formatDate(transaction.date)}</td>
                      <td className="p-3 whitespace-nowrap">{transaction.from}</td>
                      <td className="p-3 whitespace-nowrap">{transaction.to}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            transaction.voucherType === "Issue" 
                              ? "bg-red-100 text-red-800" 
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {transaction.voucherType}
                        </span>
                      </td>
                      <td className="p-3 whitespace-nowrap">{transaction.voucherNo}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            transaction.metalType === "Gold"
                              ? "bg-yellow-100 text-yellow-800"
                              : transaction.metalType === "Silver"
                              ? "bg-gray-100 text-gray-800"
                              : transaction.metalType === "Diamond"
                              ? "bg-purple-100 text-purple-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {transaction.metalType}
                        </span>
                      </td>
                      <td className="p-3 text-right whitespace-nowrap">{transaction.weight.toFixed(2)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-gray-500">
                      No transactions found. Try a different search or add new transactions.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}