"use client"

import { useState } from "react"
import DashboardHeader from "../components/DashboardHeader"
import TransactionHistory from "../components/TransactionHistory"
import BalanceView from "../components/BalanceView"
import LedgerView from "../components/LedgerView"

export default function IMSPage() {
  const [activeTab, setActiveTab] = useState("ledger")

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-cyan-50">
      <DashboardHeader />
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold text-center mb-8 text-indigo-800">Metal Inventory System</h1>

        <div className="tabs">
          <div className="flex justify-center mb-6">
            <div className="grid grid-cols-3 w-full max-w-md bg-indigo-100 rounded-md">
              <button
                className={`flex gap-2 py-3 px-4 items-center justify-center ${
                  activeTab === "ledger"
                    ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-md"
                    : "text-gray-700"
                }`}
                onClick={() => setActiveTab("ledger")}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                </svg>
                Ledger
              </button>
              <button
                className={`flex gap-2 py-3 px-4 items-center justify-center ${
                  activeTab === "balance"
                    ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-md"
                    : "text-gray-700"
                }`}
                onClick={() => setActiveTab("balance")}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
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
                Balance
              </button>
              <button
                className={`flex gap-2 py-3 px-4 items-center justify-center ${
                  activeTab === "history"
                    ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-md"
                    : "text-gray-700"
                }`}
                onClick={() => setActiveTab("history")}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
                History
              </button>
            </div>
          </div>

          <div className="mt-0">
            {activeTab === "ledger" && (
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <LedgerView />
              </div>
            )}

            {activeTab === "balance" && (
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <BalanceView />
              </div>
            )}

            {activeTab === "history" && (
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <TransactionHistory />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
