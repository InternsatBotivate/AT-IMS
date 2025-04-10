import InventoryForm from "../components/InventoryForm"
import DashboardHeader from "../components/DashboardHeader"

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <DashboardHeader />
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold text-center mb-8 text-purple-800">Metal Inventory Management</h1>
        <div className="max-w-3xl mx-auto">
          <InventoryForm />
        </div>
      </div>
    </div>
  )
}
