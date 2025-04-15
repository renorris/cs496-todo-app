"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PieChart } from "@/components/pie-chart"
import { CalendarDays, Clock, Plus } from "lucide-react"

// Mock data for task lists
const mockLists = [
  {
    id: "1",
    title: "Work Projects",
    createdAt: "2023-10-15",
    dueDate: "2023-12-31",
    totalTasks: 12,
    completedTasks: 5,
  },
  {
    id: "2",
    title: "Personal Goals",
    createdAt: "2023-09-01",
    dueDate: "2023-12-15",
    totalTasks: 8,
    completedTasks: 3,
  },
  {
    id: "3",
    title: "Home Renovation",
    createdAt: "2023-11-05",
    dueDate: "2024-02-28",
    totalTasks: 15,
    completedTasks: 2,
  },
  {
    id: "4",
    title: "Learning Docker",
    createdAt: "2023-10-20",
    dueDate: "2023-11-30",
    totalTasks: 10,
    completedTasks: 8,
  },
]

export function ListsOverview() {
  const router = useRouter()
  const [lists] = useState(mockLists)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {lists.map((list) => (
        <Card
          key={list.id}
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => router.push(`/dashboard/list/${list.id}`)}
        >
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <CardTitle>{list.title}</CardTitle>
              <Badge variant={new Date(list.dueDate) < new Date() ? "destructive" : "outline"}>
                {new Date(list.dueDate) < new Date() ? "Overdue" : "Active"}
              </Badge>
            </div>
            <CardDescription>
              <div className="flex items-center mt-2">
                <CalendarDays className="h-4 w-4 mr-1" />
                <span className="text-xs">Created: {formatDate(list.createdAt)}</span>
              </div>
              <div className="flex items-center mt-1">
                <Clock className="h-4 w-4 mr-1" />
                <span className="text-xs">Due: {formatDate(list.dueDate)}</span>
              </div>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="w-24 h-24">
                <PieChart completed={list.completedTasks} total={list.totalTasks} />
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">Progress</p>
                <p className="text-2xl font-bold">{Math.round((list.completedTasks / list.totalTasks) * 100)}%</p>
                <p className="text-xs text-muted-foreground">
                  {list.completedTasks} of {list.totalTasks} tasks
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="pt-0">
            <Button variant="outline" className="w-full">
              View Tasks
            </Button>
          </CardFooter>
        </Card>
      ))}

      {/* Add new list card */}
      <Card className="cursor-pointer hover:shadow-md transition-shadow border-dashed">
        <CardContent className="flex flex-col items-center justify-center h-full py-12">
          <Plus className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium text-center">Create New List</p>
          <p className="text-sm text-muted-foreground text-center mt-2">Add a new task list to organize your work</p>
        </CardContent>
      </Card>
    </div>
  )
}
