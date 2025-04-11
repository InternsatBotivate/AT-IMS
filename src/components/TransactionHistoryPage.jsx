"use client"

import DashboardHeader from "../components/DashboardHeader"
import TransactionHistory from "../components/TransactionHistory"
import ProtectedRoute from "../components/ProtectedRoute"

export default function TransactionHistoryPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      <main className="container mx-auto px-4 py-6">
        <TransactionHistory />
      </main>
    </div>
  )
}