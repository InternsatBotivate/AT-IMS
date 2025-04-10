"use client"

import { useState, useEffect, useCallback } from "react"
import { Link } from "react-router-dom"

export default function LedgerView() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedMetal, setSelectedMetal] = useState("Gold")
  const [metalOptions, setMetalOptions] = useState([])
  const [showMetalDropdown, setShowMetalDropdown] = useState(false)
  const [ledgerData, setLedgerData] = useState([])
  const [originalLedgerData, setOriginalLedgerData] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDataLoading, setIsDataLoading] = useState(false)
  const [error, setError] = useState(null)
  
  // Google Sheet details
  const sheetId = '1tpKmn957d-nuxtKgcRGPkTh5NL2i33guyuS32l-sAEA'
  const masterSheetName = 'Master'
  const ledgerSheetName = 'Ledger'
  
  // Apps Script Web App URL
  const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxqj8Ypi4ursJSlcWNT-Xo82G67hat_lOqmjS4dWSxjFKmcxj_Wu-KvURKr85KpfKej/exec'
  
  // Update Ledger sheet's metal type
  const updateLedgerSheetMetalType = async (metalType) => {
    try {
      const formData = new FormData()
      formData.append('sheetName', 'Ledger')
      formData.append('action', 'update')
      formData.append('rowIndex', '1') // Row 1 (first row)
      formData.append('columnIndex', '2') // Column B
      formData.append('value', metalType)
      
      const response = await fetch(SCRIPT_URL, {
        method: 'POST',
        body: formData
      })
      
      const result = await response.json()
      
      if (result.success) {
        console.log('Ledger sheet updated successfully')
        return true
      } else {
        console.error('Failed to update Ledger sheet')
        return false
      }
    } catch (error) {
      console.error('Error updating Ledger sheet:', error)
      return false
    }
  }
  
  // Fetch and process ledger data
  const fetchLedgerData = useCallback(async (metal) => {
    try {
      // Fetch Ledger sheet data
      const ledgerUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(ledgerSheetName)}`
      
      console.log("Fetching ledger data for metal:", metal)
      
      const ledgerResponse = await fetch(ledgerUrl)
      if (!ledgerResponse.ok) {
        throw new Error(`Failed to fetch Ledger data: ${ledgerResponse.status}`)
      }
      
      // Extract JSON data from the Ledger sheet response
      const ledgerText = await ledgerResponse.text()
      
      const ledgerJsonStart = ledgerText.indexOf('{')
      const ledgerJsonEnd = ledgerText.lastIndexOf('}')
      
      if (ledgerJsonStart === -1 || ledgerJsonEnd === -1) {
        throw new Error("Invalid response format from Ledger Sheets")
      }
      
      const ledgerJsonString = ledgerText.substring(ledgerJsonStart, ledgerJsonEnd + 1)
      const ledgerData = JSON.parse(ledgerJsonString)
      
      // Process ledger entries
      const ledgerEntries = []
      
      if (ledgerData.table && ledgerData.table.rows) {
        // Start from row 2 (index 1) to skip headers
        for (let i = 1; i < ledgerData.table.rows.length; i++) {
          const row = ledgerData.table.rows[i]
          
          // Skip empty rows
          if (!row.c || !row.c[0]) continue
          
          // Extract values from specific columns
          const entry = {
            name: row.c[0] ? (row.c[0].v || '').toString().trim() : '',
            metalType: row.c[1] ? (row.c[1].v || '').toString().trim() : '',
            dr: row.c[2] ? Number(row.c[2].v || 0) : 0,
            cr: row.c[3] ? Number(row.c[3].v || 0) : 0,
            balance: row.c[4] ? Number(row.c[4].v || 0) : 0,
          }
          
          ledgerEntries.push(entry)
        }
      }
      
      // Filter entries based on selected metal
      const filteredEntries = ledgerEntries.filter(entry => 
        entry.metalType.toLowerCase() === metal.toLowerCase()
      )
      
      console.log("Filtered entries:", filteredEntries)
      
      return {
        originalEntries: ledgerEntries,
        filteredEntries: filteredEntries
      }
    } catch (error) {
      console.error("Error processing ledger data:", error)
      throw error
    }
  }, [sheetId, ledgerSheetName])
  
  // Initial data fetch and setup
  useEffect(() => {
    const initializeData = async () => {
      try {
        // Fetch Master sheet data for metal options
        const masterUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(masterSheetName)}`
        
        const masterResponse = await fetch(masterUrl)
        if (!masterResponse.ok) {
          throw new Error(`Failed to fetch Master data: ${masterResponse.status}`)
        }
        
        const masterText = await masterResponse.text()
        
        const masterJsonStart = masterText.indexOf('{')
        const masterJsonEnd = masterText.lastIndexOf('}')
        
        if (masterJsonStart === -1 || masterJsonEnd === -1) {
          throw new Error("Invalid response format from Master Sheets")
        }
        
        const masterJsonString = masterText.substring(masterJsonStart, masterJsonEnd + 1)
        const masterData = JSON.parse(masterJsonString)
        
        // Extract metal options from Master sheet column C
        const uniqueMetals = new Set()
        
        if (masterData.table && masterData.table.rows) {
          const metalTypes = masterData.table.rows
            .slice(1)
            .map(row => row.c && row.c[2] ? row.c[2].v : null)
            .filter(metalType => metalType !== null)
          
          metalTypes.forEach(metalType => {
            const trimmedMetal = metalType.toString().trim()
            if (trimmedMetal) {
              uniqueMetals.add(trimmedMetal)
            }
          })
          
          const metalOptionsArray = Array.from(uniqueMetals).sort()
          setMetalOptions(metalOptionsArray)
          
          // Ensure Gold is the first option if it exists
          const initialMetal = metalOptionsArray.includes("Gold") ? "Gold" : metalOptionsArray[0]
          
          // Update sheet and fetch data
          await updateLedgerSheetMetalType(initialMetal)
          const { originalEntries, filteredEntries } = await fetchLedgerData(initialMetal)
          
          setSelectedMetal(initialMetal)
          setOriginalLedgerData(originalEntries)
          setLedgerData(filteredEntries)
        }
      } catch (error) {
        console.error("Error initializing data:", error)
        setError("Failed to load data. Please try again later.")
      } finally {
        setIsLoading(false)
      }
    }
    
    initializeData()
  }, [])
  
  // Handle metal type selection
  const handleMetalSelect = async (metal) => {
    try {
      // Immediately update UI
      setSelectedMetal(metal)
      setShowMetalDropdown(false)
      
      // Filter local data immediately
      const localFilteredEntries = originalLedgerData.filter(entry => 
        entry.metalType.toLowerCase() === metal.toLowerCase()
      )
      setLedgerData(localFilteredEntries)
      
      // Start loading indicator for remote update
      setIsDataLoading(true)
      
      // Update sheet in background
      const updateSuccess = await updateLedgerSheetMetalType(metal)
      
      if (updateSuccess) {
        // Fetch and filter data
        const { originalEntries, filteredEntries } = await fetchLedgerData(metal)
        
        // Update state
        setOriginalLedgerData(originalEntries)
        setLedgerData(filteredEntries)
      }
    } catch (error) {
      console.error("Error selecting metal type:", error)
    } finally {
      setIsDataLoading(false)
    }
  }
  
  // Filter ledger data based on search term
  const filteredData = ledgerData.filter(entry => 
    entry.name.toLowerCase().includes(searchTerm.toLowerCase())
  )
  
  // Handle delete button click
  const handleDelete = (name) => {
    // TODO: Implement actual deletion from Google Sheet
    
    // Remove from local state
    setLedgerData(prev => prev.filter(entry => entry.name !== name))
    
    // Show confirmation
    alert(`Deleted entry for ${name}`)
  }

  return (
    <div>
      <div className="p-4 bg-gradient-to-r from-indigo-100 to-cyan-100">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative col-span-2">
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
              placeholder="Search by party name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 pl-9 border-indigo-200 border rounded-md focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </div>
          <div className="relative">
            <button
              type="button"
              className="w-full px-4 py-2 text-left bg-white border border-indigo-200 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              onClick={() => setShowMetalDropdown(!showMetalDropdown)}
            >
              {selectedMetal || "Select metal type"}
            </button>
            {showMetalDropdown && (
              <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                {metalOptions.map((metal) => (
                  <div
                    key={metal}
                    className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-indigo-50 text-gray-900"
                    onClick={() => handleMetalSelect(metal)}
                  >
                    {metal}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 pb-4 pt-2">
        <div className="border-2 border-indigo-200 rounded-lg overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white p-3">
            <h3 className="text-lg font-bold">LEDGER - {selectedMetal.toUpperCase()}</h3>
          </div>
          <div className="p-0">
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="ml-2 text-indigo-600">Loading ledger data...</span>
              </div>
            ) : error ? (
              <div className="text-center py-8 text-red-500">{error}</div>
            ) : isDataLoading ? (
              <div className="flex justify-center items-center py-8">
                <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="ml-2 text-indigo-600">Updating ledger data...</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-indigo-50">
                    <tr>
                      <th className="text-indigo-700 p-3 font-bold text-left">NAME</th>
                      <th className="text-indigo-700 p-3 font-bold text-center">METAL TYPE</th>
                      <th className="text-indigo-700 p-3 font-bold text-right">DR</th>
                      <th className="text-indigo-700 p-3 font-bold text-right">CR</th>
                      <th className="text-indigo-700 p-3 font-bold text-right">BALANCE</th>
                      <th className="text-indigo-700 p-3 font-bold text-center">ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.length > 0 ? (
                      filteredData.map((entry, index) => (
                        <tr key={`${entry.name}-${index}`} className="hover:bg-indigo-50/50 border-b">
                          <td className="p-3 font-bold uppercase">{entry.name}</td>
                          <td className="p-3 text-center font-medium">{entry.metalType}</td>
                          <td className="p-3 text-right font-medium text-red-600">{entry.dr.toFixed(1)}</td>
                          <td className="p-3 text-right font-medium text-green-600">{entry.cr.toFixed(1)}</td>
                          <td
                            className={`p-3 text-right font-bold ${
                              entry.balance < 0 ? "text-red-600" : entry.balance > 0 ? "text-green-600" : ""
                            }`}
                          >
                            {entry.balance.toFixed(1)}
                          </td>
                          <td className="p-3 text-center flex justify-center space-x-2">
                            <Link to={`/party-details/${encodeURIComponent(entry.name)}`}>
                              <button className="px-3 py-1 text-sm rounded border border-indigo-200 text-indigo-600 hover:bg-indigo-50">
                                Details
                              </button>
                            </Link>
                            <button 
                              className="p-1 text-red-500 hover:bg-red-50 rounded"
                              onClick={() => handleDelete(entry.name)}
                            >
                              <svg 
                                xmlns="http://www.w3.org/2000/svg" 
                                width="18" 
                                height="18" 
                                viewBox="0 0 24 24" 
                                fill="none" 
                                stroke="currentColor" 
                                strokeWidth="2" 
                                strokeLinecap="round" 
                                strokeLinejoin="round"
                              >
                                <path d="M3 6h18"></path>
                                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                                <line x1="10" y1="11" x2="10" y2="17"></line>
                                <line x1="14" y1="11" x2="14" y2="17"></line>
                              </svg>
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-gray-500">
                          No entries found. Try a different search or add new transactions.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}