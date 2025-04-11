"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../contexts/AuthContext"

export default function TransactionHistory() {
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [transactions, setTransactions] = useState([])
  const [headers, setHeaders] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [transactionToDelete, setTransactionToDelete] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [notification, setNotification] = useState({ show: false, message: "", type: "" })
  const [showDeleteColumn, setShowDeleteColumn] = useState(true) // New state to control delete column visibility

  // Google Sheet details
  const sheetId = "1tpKmn957d-nuxtKgcRGPkTh5NL2i33guyuS32l-sAEA"
  const entriesSheetName = "Entries"
  const scriptUrl =
    "https://script.google.com/macros/s/AKfycbxqj8Ypi4ursJSlcWNT-Xo82G67hat_lOqmjS4dWSxjFKmcxj_Wu-KvURKr85KpfKej/exec"

  // Fetch transactions from Entries sheet
  const fetchTransactions = async () => {
    try {
      // Fetch Entries sheet data
      const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(entriesSheetName)}`

      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Failed to fetch Entries data: ${response.status}`)
      }

      // Extract JSON data from the response
      const text = await response.text()

      const jsonStart = text.indexOf("{")
      const jsonEnd = text.lastIndexOf("}")

      if (jsonStart === -1 || jsonEnd === -1) {
        throw new Error("Invalid response format from Entries Sheets")
      }

      const jsonString = text.substring(jsonStart, jsonEnd + 1)
      const data = JSON.parse(jsonString)

      // Check if headers are just letter labels (A, B, C, etc.)
      // This indicates no real data headers were set in the sheet
      const hasLetterHeaders = data.table.cols.every(
        (col) => col.id.length === 1 && /^[A-Z]$/.test(col.id) && (!col.label || col.label === col.id),
      )

      // Extract headers (first row)
      const extractedHeaders = data.table.cols.map((col) => col.label || col.id).slice(0, 7) // Take first 7 columns

      // Decide whether to show the delete column based on data and user role
      const hasRealData = data.table && data.table.rows && data.table.rows.length > 0
      const isAdmin = user?.role === "admin"
      setShowDeleteColumn(hasRealData && !hasLetterHeaders && isAdmin)

      // Only add Action column if we're showing delete buttons
      if (showDeleteColumn && isAdmin) {
        setHeaders([...extractedHeaders, "Action"])
      } else {
        setHeaders(extractedHeaders)
      }

      // Process rows
      const fetchedTransactions = []

      if (data.table && data.table.rows) {
        for (let i = 0; i < data.table.rows.length; i++) {
          const row = data.table.rows[i]

          // Skip empty rows
          if (!row.c || !row.c[0]) continue

          // Extract transaction details
          const transaction = {
            rowIndex: i + 2, // Google Sheets rows are 1-indexed, and header is row 1
            id: i, // Use row index as unique identifier
            date: row.c[0] ? (row.c[0].v || "").toString() : "", // Date column
            from: row.c[1] ? (row.c[1].v || "").toString().trim() : "", // From column
            to: row.c[2] ? (row.c[2].v || "").toString().trim() : "", // To column
            voucherType: row.c[3] ? (row.c[3].v || "").toString().trim() : "", // Voucher Type column
            voucherNo: row.c[4] ? (row.c[4].v || "").toString().trim() : "", // Voucher No column
            metalType: row.c[5] ? (row.c[5].v || "").toString().trim() : "", // Metal Type column
            weight: row.c[6] ? Number(row.c[6].v || 0) : 0, // Weight column
          }

          fetchedTransactions.push(transaction)
        }
      }

      setTransactions(fetchedTransactions)
      setIsLoading(false)
    } catch (error) {
      console.error("Error fetching transactions:", error)
      setError("Failed to load transactions")
      setIsLoading(false)
    }
  }

  // Show confirmation dialog
  const confirmDelete = (transaction) => {
    setTransactionToDelete(transaction)
    setShowConfirmDialog(true)
  }

  // Delete transaction
  const handleDelete = async () => {
    if (!transactionToDelete) return

    setIsDeleting(true)
    try {
      const formData = new FormData()
      formData.append("sheetName", entriesSheetName)
      formData.append("action", "delete")
      formData.append("rowIndex", transactionToDelete.rowIndex)

      const response = await fetch(scriptUrl, {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (result.success) {
        // Remove the transaction from local state
        setTransactions((prev) => prev.filter((transaction) => transaction.rowIndex !== transactionToDelete.rowIndex))

        // Show success notification
        setNotification({
          show: true,
          message: "Transaction deleted successfully",
          type: "success",
        })
      } else {
        throw new Error(result.error || "Failed to delete transaction")
      }
    } catch (error) {
      console.error("Error deleting transaction:", error)

      // Show error notification
      setNotification({
        show: true,
        message: "Could not delete the transaction",
        type: "error",
      })
    } finally {
      setIsDeleting(false)
      setShowConfirmDialog(false)
      setTransactionToDelete(null)

      // Hide notification after 3 seconds
      setTimeout(() => {
        setNotification({ show: false, message: "", type: "" })
      }, 3000)
    }
  }

  // Fetch transactions on component mount or when user changes
  useEffect(() => {
    fetchTransactions()
  }, [user])

  // Filter transactions based on search term
  const filteredTransactions = transactions.filter(
    (transaction) =>
      transaction.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.to.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.voucherNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.metalType.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Format date string to DD/MM/YYYY format
  const formatDate = (dateString) => {
    // Handle different date formats
    if (!dateString) return "Invalid Date"

    // Check if date is already in DD/MM/YYYY format
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
      return dateString
    }

    // Handle Google Sheets "Date(year,month,day)" format
    const dateMatch = dateString.match(/Date$$(\d+),(\d+),(\d+)$$/)
    if (dateMatch) {
      // JavaScript months are 0-indexed, but we want 1-indexed for display
      const year = dateMatch[1]
      const month = Number.parseInt(dateMatch[2]) + 1 // Add 1 because JS months are 0-indexed
      const day = dateMatch[3]

      // Format with leading zeros - convert to strings first
      const formattedDay = String(day).padStart(2, "0")
      const formattedMonth = String(month).padStart(2, "0")

      return `${formattedDay}/${formattedMonth}/${year}`
    }

    // Fallback to standard date parsing
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) {
        return dateString // Return original if not a valid date
      }

      const day = date.getDate().toString().padStart(2, "0")
      const month = (date.getMonth() + 1).toString().padStart(2, "0") // getMonth() is 0-indexed
      const year = date.getFullYear()

      return `${day}/${month}/${year}`
    } catch {
      return dateString
    }
  }

  return (
    <div className="p-4">
      {/* Notification Toast */}
      {notification.show && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded-md shadow-lg flex items-center ${
            notification.type === "success"
              ? "bg-green-100 border-l-4 border-green-500"
              : "bg-red-100 border-l-4 border-red-500"
          }`}
        >
          <div className={`mr-3 ${notification.type === "success" ? "text-green-500" : "text-red-500"}`}>
            {notification.type === "success" ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </div>
          <div className={notification.type === "success" ? "text-green-800" : "text-red-800"}>
            {notification.message}
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <div className="text-center mb-4">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900">Delete Transaction</h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete this transaction? This action cannot be undone.
                </p>
              </div>
              {transactionToDelete && (
                <div className="mt-3 p-3 bg-gray-50 rounded-md text-left">
                  <p className="text-xs text-gray-500">Transaction Details:</p>
                  <p className="text-sm">
                    <span className="font-medium">Date:</span> {formatDate(transactionToDelete.date)}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">From:</span> {transactionToDelete.from}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">To:</span> {transactionToDelete.to}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Metal:</span> {transactionToDelete.metalType}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Weight:</span> {transactionToDelete.weight.toFixed(2)}
                  </p>
                </div>
              )}
            </div>
            <div className="mt-5 sm:mt-6 flex justify-end space-x-3">
              <button
                type="button"
                className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                onClick={() => setShowConfirmDialog(false)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

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
                  {headers.map((header, index) => (
                    <th
                      key={index}
                      className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {header}
                    </th>
                  ))}
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
                      {showDeleteColumn && user?.role === "admin" && (
                        <td className="p-3">
                          <button
                            onClick={() => confirmDelete(transaction)}
                            className="text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors duration-200 flex items-center justify-center"
                            title="Delete Transaction"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={headers.length} className="text-center py-8 text-gray-500">
                      <div className="flex flex-col items-center justify-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-12 w-12 text-gray-400 mb-3"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1}
                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                          />
                        </svg>
                        <p className="text-lg font-medium mb-1">No data available</p>
                        <p className="text-sm text-gray-500">
                          {searchTerm
                            ? "No transactions found matching your search criteria."
                            : "There are no transactions in the system yet."}
                        </p>
                      </div>
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
