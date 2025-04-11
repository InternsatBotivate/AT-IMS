import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider } from "./contexts/AuthContext"
import { Toaster } from "./components/Toaster"
import LoginPage from "./pages/LoginPage"
import DashboardPage from "./pages/DashboardPage"
import IMSPage from "./pages/IMSPage"
import PartyDetailsPage from "./pages/PartyDetailsPage"
import TransactionHistoryPage from "./components/TransactionHistoryPage"
import ProtectedRoute from "./components/ProtectedRoute"
import AdminRoute from "./components/AdminRoute"

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/transaction-history"
            element={
              <ProtectedRoute>
                <TransactionHistoryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ims"
            element={
              <AdminRoute>
                <IMSPage />
              </AdminRoute>
            }
          />
          <Route
            path="/party-details/:party"
            element={
              <ProtectedRoute>
                <PartyDetailsPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster />
    </AuthProvider>
  )
}

export default App