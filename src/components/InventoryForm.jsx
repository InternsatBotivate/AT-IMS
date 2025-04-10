"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { getTransactions } from "../data/metalData"
import { toast } from "./Toaster"

function InventoryForm() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  // Form data state
  const [formData, setFormData] = useState({
    from: "",
    to: "",
    voucherType: "Issue",
    voucherNo: "",
    metalType: "Gold",
    weight: "",
  })

  // Party input states
  const [newPartyFrom, setNewPartyFrom] = useState("")
  const [newPartyTo, setNewPartyTo] = useState("")
  
  // Dropdown states
  const [showFromDropdown, setShowFromDropdown] = useState(false)
  const [showToDropdown, setShowToDropdown] = useState(false)
  const [showMetalDropdown, setShowMetalDropdown] = useState(false)
  
  // Dropdown options state (separate arrays for each dropdown)
  const [fromPartyOptions, setFromPartyOptions] = useState([])
  const [toPartyOptions, setToPartyOptions] = useState([])
  const [metalTypeOptions, setMetalTypeOptions] = useState([])
  
  // Google Sheet details - globally defined
  const sheetId = '1tpKmn957d-nuxtKgcRGPkTh5NL2i33guyuS32l-sAEA'
  const sheetName = 'Entries'
  const masterSheetName = 'Master' // Master sheet for dropdown options
  
  // Google Apps Script Web App URL - globally defined
  const scriptUrl = 'https://script.google.com/macros/s/AKfycbxqj8Ypi4ursJSlcWNT-Xo82G67hat_lOqmjS4dWSxjFKmcxj_Wu-KvURKr85KpfKej/exec'

  useEffect(() => {
    // Fetch dropdown options from Master sheet when component mounts
    fetchDropdownOptions()
  }, [])

  const fetchDropdownOptions = async () => {
    setIsLoading(true)
    try {
      // Using publicly accessible URL to fetch Master sheet data
      const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(masterSheetName)}`
      
      console.log("Fetching dropdown options from Master sheet:", url)
      
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Failed to fetch Master sheet data: ${response.status}`)
      }
      
      // Extract JSON data from the response (Google returns wrapped JSON)
      const text = await response.text()
      console.log("Raw response (first 100 chars):", text.substring(0, 100))
      
      const jsonStart = text.indexOf('{')
      const jsonEnd = text.lastIndexOf('}')
      
      if (jsonStart === -1 || jsonEnd === -1) {
        throw new Error("Invalid response format from Google Sheets")
      }
      
      const jsonString = text.substring(jsonStart, jsonEnd + 1)
      const data = JSON.parse(jsonString)
      
      console.log("Parsed Master sheet data:", data)
      
      // Extract options from the three columns
      const fromOptions = []
      const toOptions = []
      const metalOptions = []
      
      if (data.table && data.table.rows) {
        console.log(`Found ${data.table.rows.length} rows in the Master sheet`)
        
        // Skip the header row (index 0)
        for (let i = 1; i < data.table.rows.length; i++) {
          const row = data.table.rows[i]
          
          // Column A: From options
          if (row.c && row.c[0] && row.c[0].v) {
            fromOptions.push(row.c[0].v.toString().trim())
          }
          
          // Column B: To options
          if (row.c && row.c[1] && row.c[1].v) {
            toOptions.push(row.c[1].v.toString().trim())
          }
          
          // Column C: Metal Type options
          if (row.c && row.c[2] && row.c[2].v) {
            metalOptions.push(row.c[2].v.toString().trim())
          }
        }
      }
      
      // Filter out empty values and sort
      const validFromOptions = fromOptions.filter(Boolean).sort()
      const validToOptions = toOptions.filter(Boolean).sort()
      const validMetalOptions = metalOptions.filter(Boolean).sort()
      
      console.log("From party options:", validFromOptions)
      console.log("To party options:", validToOptions)
      console.log("Metal type options:", validMetalOptions)
      
      // Update state with the fetched options
      if (validFromOptions.length > 0) {
        setFromPartyOptions(validFromOptions)
      } else {
        // Fallback to default if no options found
        setFromPartyOptions(["vikas", "aript"])
      }
      
      if (validToOptions.length > 0) {
        setToPartyOptions(validToOptions)
      } else {
        // Fallback to default if no options found
        setToPartyOptions(["shivam", "rahul"])
      }
      
      if (validMetalOptions.length > 0) {
        setMetalTypeOptions(validMetalOptions)
      } else {
        // Fallback to default if no options found
        setMetalTypeOptions(["Gold", "Diamond", "Silver", "Platinum"])
      }
    } catch (error) {
      console.error("Error fetching dropdown options:", error)
      // Fallback to default options if fetch fails
      setFromPartyOptions(["vikas", "aript"])
      setToPartyOptions(["shivam", "rahul"])
      setMetalTypeOptions(["Gold", "Diamond", "Silver", "Platinum"])
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Handle new party entries
      let fromParty = formData.from
      let toParty = formData.to

      if (formData.from === "New Party") {
        if (!newPartyFrom.trim()) {
          toast({
            title: "Validation Error",
            description: "Please enter a name for the new party",
            variant: "destructive",
          })
          setIsSubmitting(false)
          return
        }
        fromParty = newPartyFrom.trim()
      }

      if (formData.to === "New Party") {
        if (!newPartyTo.trim()) {
          toast({
            title: "Validation Error",
            description: "Please enter a name for the new party",
            variant: "destructive",
          })
          setIsSubmitting(false)
          return
        }
        toParty = newPartyTo.trim()
      }

      // Validate form
      if (!fromParty || !toParty || !formData.voucherNo || !formData.weight) {
        toast({
          title: "Validation Error",
          description: "Please fill all required fields",
          variant: "destructive",
        })
        setIsSubmitting(false)
        return
      }

      // Generate timestamp for the transaction with dd/mm/yyyy format
      const now = new Date()
      const day = String(now.getDate()).padStart(2, '0')
      const month = String(now.getMonth() + 1).padStart(2, '0') // Month is 0-indexed
      const year = now.getFullYear()
      const timestamp = `${day}/${month}/${year}`
      const transactionId = Date.now().toString()
      
      // Format data for Google Sheets - this array order should match your sheet columns
      const rowData = [
        timestamp,                           // Date
        fromParty,                           // From Party
        toParty,                             // To Party
        formData.voucherType,                // Voucher Type
        formData.voucherNo,                  // Voucher No
        formData.metalType,                  // Metal Type
        Number.parseFloat(formData.weight),  // Weight
      ]

      console.log("Preparing to submit data:", rowData);
      
      // Create a URL with query parameters for the Google Apps Script
      const url = new URL(scriptUrl);
      url.searchParams.append('sheetName', sheetName);
      url.searchParams.append('action', 'insert');
      url.searchParams.append('rowData', JSON.stringify(rowData));
      
      console.log("Submitting to URL:", url.toString());

      // Send data to Google Sheets using XMLHttpRequest
      const xhr = new XMLHttpRequest();
      xhr.open('POST', url.toString(), true);
      xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
      
      // Create a listener for when the request completes
      xhr.onload = function() {
        console.log('Submission complete with status:', xhr.status);
        if (xhr.status >= 200 && xhr.status < 300) {
          console.log('Response:', xhr.responseText);
          
          // Show success message in top right corner
          toast({
            title: "Transaction Added",
            description: "Your inventory transaction has been recorded successfully.",
            variant: "default",
          });
          
          // Reset form
          setFormData({
            from: "",
            to: "",
            voucherType: "Issue",
            voucherNo: "",
            metalType: "Gold",
            weight: "",
          });
          setNewPartyFrom("");
          setNewPartyTo("");
          
        } else {
          console.error('Error submitting data:', xhr.statusText);
          
          // Show error message in top right corner
          toast({
            title: "Submission Error",
            description: "There was a problem submitting the transaction. Please try again.",
            variant: "destructive",
          });
        }
        
        // Set submitting state to false when done
        setIsSubmitting(false);
      };
      
      // Handle network errors
      xhr.onerror = function() {
        console.error('Network error occurred');
        
        // Show error message in top right corner
        toast({
          title: "Network Error",
          description: "Could not connect to the server. Please check your connection and try again.",
          variant: "destructive",
        });
        
        // Set submitting state to false when done
        setIsSubmitting(false);
      };
      
      // Send the request
      xhr.send();
    } catch (error) {
      console.error("Error submitting form:", error)
      toast({
        title: "Submission Error",
        description: "There was a problem submitting the transaction. Please try again.",
        variant: "destructive",
      })
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="bg-purple-600 p-4">
        <h3 className="text-white text-xl font-medium">New Transaction Entry</h3>
      </div>
      <div className="p-6">
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="ml-2 text-purple-600">Loading...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="from" className="block text-sm font-medium text-purple-700">
                  From (Giving) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <button
                    type="button"
                    className="w-full px-4 py-2.5 text-left bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    onClick={() => setShowFromDropdown(!showFromDropdown)}
                  >
                    {formData.from || "Select party"}
                  </button>
                  <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                    <svg
                      className="h-5 w-5 text-gray-400"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                  {showFromDropdown && (
                    <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                      {fromPartyOptions.map((party) => (
                        <div
                          key={`from-${party}`}
                          className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-purple-50 text-gray-900"
                          onClick={() => {
                            handleChange("from", party)
                            setShowFromDropdown(false)
                          }}
                        >
                          {party}
                        </div>
                      ))}
                      <div
                        className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-purple-50 text-purple-600 font-medium"
                        onClick={() => {
                          handleChange("from", "New Party")
                          setShowFromDropdown(false)
                        }}
                      >
                        + Add New Party
                      </div>
                    </div>
                  )}
                </div>
                {formData.from === "New Party" && (
                  <input
                    placeholder="Enter new party name"
                    className="mt-2 w-full px-4 py-2.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    value={newPartyFrom}
                    onChange={(e) => setNewPartyFrom(e.target.value)}
                  />
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="to" className="block text-sm font-medium text-purple-700">
                  To (Taking) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <button
                    type="button"
                    className="w-full px-4 py-2.5 text-left bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    onClick={() => setShowToDropdown(!showToDropdown)}
                  >
                    {formData.to || "Select party"}
                  </button>
                  <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                    <svg
                      className="h-5 w-5 text-gray-400"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                  {showToDropdown && (
                    <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                      {toPartyOptions.map((party) => (
                        <div
                          key={`to-${party}`}
                          className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-purple-50 text-gray-900"
                          onClick={() => {
                            handleChange("to", party)
                            setShowToDropdown(false)
                          }}
                        >
                          {party}
                        </div>
                      ))}
                      <div
                        className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-purple-50 text-purple-600 font-medium"
                        onClick={() => {
                          handleChange("to", "New Party")
                          setShowToDropdown(false)
                        }}
                      >
                        + Add New Party
                      </div>
                    </div>
                  )}
                </div>
                {formData.to === "New Party" && (
                  <input
                    placeholder="Enter new party name"
                    className="mt-2 w-full px-4 py-2.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    value={newPartyTo}
                    onChange={(e) => setNewPartyTo(e.target.value)}
                  />
                )}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-purple-700">Voucher Type</label>
                <div className="flex space-x-6 mt-1">
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="issue"
                      name="voucherType"
                      value="Issue"
                      checked={formData.voucherType === "Issue"}
                      onChange={() => handleChange("voucherType", "Issue")}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300"
                    />
                    <label htmlFor="issue" className="ml-2 block text-sm text-gray-700 cursor-pointer">
                      Issue
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="receipt"
                      name="voucherType"
                      value="Receipt"
                      checked={formData.voucherType === "Receipt"}
                      onChange={() => handleChange("voucherType", "Receipt")}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300"
                    />
                    <label htmlFor="receipt" className="ml-2 block text-sm text-gray-700 cursor-pointer">
                      Receipt
                    </label>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="voucherNo" className="block text-sm font-medium text-purple-700">
                  Voucher No. <span className="text-red-500">*</span>
                </label>
                <input
                  id="voucherNo"
                  placeholder="Enter voucher number"
                  value={formData.voucherNo}
                  onChange={(e) => handleChange("voucherNo", e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  required
                />
              </div>
            </div>

{/* METAL TYPE DROPDOWN - FIXED TO PREVENT CUT-OFF */}
<div className="space-y-2 dropdown-container">
  <label htmlFor="metalType" className="block text-sm font-medium text-purple-700">
    Metal Type
  </label>
  <div className="relative">
    <button
      type="button"
      className="w-full px-4 py-2.5 text-left bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
      onClick={() => {
        setShowMetalDropdown(!showMetalDropdown)
        setShowFromDropdown(false)
        setShowToDropdown(false)
      }}
    >
      {formData.metalType || "Select metal type"}
    </button>
    <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
      <svg
        className="h-5 w-5 text-gray-400"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
          clipRule="evenodd"
        />
      </svg>
    </span>
    {showMetalDropdown && (
      <div
        className="absolute z-50 mt-1 w-full bg-white shadow-lg rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm"
        style={{ 
          maxHeight: "240px", 
          overflow: "auto", 
          position: "absolute", 
          top: "100%",
          left: 0,
          width: "100%",
          // Prevent menu from being cut off
          transformOrigin: "top"
        }}
        onClick={(e) => e.stopPropagation()}
        onScroll={(e) => e.stopPropagation()}
      >
        {metalTypeOptions.map((metal) => (
          <div
            key={`metal-${metal}`}
            className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-purple-50 text-gray-900"
            onClick={() => {
              handleChange("metalType", metal)
              setShowMetalDropdown(false)
            }}
          >
            {metal}
          </div>
        ))}
      </div>
    )}
  </div>

              <div className="space-y-2">
                <label htmlFor="weight" className="block text-sm font-medium text-purple-700">
                  Weight (grams) <span className="text-red-500">*</span>
                </label>
                <input
                  id="weight"
                  type="number"
                  step="0.1"
                  placeholder="Enter weight in grams"
                  value={formData.weight}
                  onChange={(e) => handleChange("weight", e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  required
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-6 py-2.5 bg-purple-600 text-white font-medium text-sm rounded-md shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 ${
                  isSubmitting ? "opacity-70 cursor-not-allowed" : ""
                }`}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2 inline-block"></div>
                    Submitting...
                  </>
                ) : (
                  "Submit Transaction"
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default InventoryForm