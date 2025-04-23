import { TaskList } from "@/components/task-list"
import { DashboardHeader } from "@/components/dashboard-header"
import { AccessPanel } from "@/components/access-panel"

interface TaskListPageProps {
  params: {
    uuid: string
  }
}

export default function TaskListPage({ params }: TaskListPageProps) {
  const listId = params.uuid

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <main className="container mx-auto p-4 md:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <TaskList listId={listId} />
          </div>
          <div className="lg:col-span-1">
            <AccessPanel listId={listId} />
          </div>
        </div>
      </main>
    </div>
  )
}
