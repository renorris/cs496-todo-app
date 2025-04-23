import ListsOverview from "@/components/lists-overview"
import { DashboardHeader } from "@/components/dashboard-header"

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <main className="container mx-auto p-4 md:p-6">
        <h1 className="text-3xl font-bold mb-6">My Lists</h1>
        <ListsOverview />
      </main>
    </div>
  )
}
