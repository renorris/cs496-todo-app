"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { CalendarDays, Clock, Plus, Trash2 } from "lucide-react"

// Mock data for tasks
const mockListData = {
  "1": {
    id: "1",
    title: "Work Projects",
    createdAt: "2023-10-15",
    dueDate: "2023-12-31",
    tasks: [
      {
        id: "task1",
        title: "Complete Docker setup",
        description: "Set up Docker containers for the development environment",
        createdAt: "2023-10-16",
        dueDate: "2023-10-25",
        completed: true,
      },
      {
        id: "task2",
        title: "Write documentation",
        description: "Document the containerization process for the team",
        createdAt: "2023-10-17",
        dueDate: "2023-11-05",
        completed: false,
      },
      {
        id: "task3",
        title: "Create CI/CD pipeline",
        description: "Set up automated testing and deployment",
        createdAt: "2023-10-18",
        dueDate: "2023-11-15",
        completed: false,
      },
      {
        id: "task4",
        title: "Optimize Docker images",
        description: "Reduce image size and improve build times",
        createdAt: "2023-10-20",
        dueDate: "2023-11-10",
        completed: false,
      },
      {
        id: "task5",
        title: "Security audit",
        description: "Review container security and implement best practices",
        createdAt: "2023-10-22",
        dueDate: "2023-11-20",
        completed: false,
      },
    ],
  },
  "2": {
    id: "2",
    title: "Personal Goals",
    createdAt: "2023-09-01",
    dueDate: "2023-12-15",
    tasks: [
      {
        id: "task1",
        title: "Learn Docker basics",
        description: "Complete Docker fundamentals course",
        createdAt: "2023-09-02",
        dueDate: "2023-09-30",
        completed: true,
      },
      {
        id: "task2",
        title: "Build a sample containerized app",
        description: "Create a simple app using Docker",
        createdAt: "2023-09-05",
        dueDate: "2023-10-15",
        completed: true,
      },
      {
        id: "task3",
        title: "Learn Docker Compose",
        description: "Study multi-container applications",
        createdAt: "2023-09-10",
        dueDate: "2023-10-30",
        completed: false,
      },
    ],
  },
  // Add more lists as needed
}

interface TaskListProps {
  listId: string
}

export function TaskList({ listId }: TaskListProps) {
  const listData = mockListData[listId as keyof typeof mockListData]
  const [tasks, setTasks] = useState(listData?.tasks || [])
  const [newTaskTitle, setNewTaskTitle] = useState("")

  if (!listData) {
    return <div>List not found</div>
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const toggleTaskCompletion = (taskId: string) => {
    setTasks(tasks.map((task) => (task.id === taskId ? { ...task, completed: !task.completed } : task)))
  }

  const addNewTask = () => {
    if (newTaskTitle.trim() === "") return

    const newTask = {
      id: `task${tasks.length + 1}`,
      title: newTaskTitle,
      description: "",
      createdAt: new Date().toISOString().split("T")[0],
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      completed: false,
    }

    setTasks([...tasks, newTask])
    setNewTaskTitle("")
  }

  const removeTask = (taskId: string) => {
    setTasks(tasks.filter((task) => task.id !== taskId))
  }

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date()
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{listData.title}</h1>
          <div className="flex items-center mt-2 space-x-4">
            <div className="flex items-center">
              <CalendarDays className="h-4 w-4 mr-1" />
              <span className="text-sm">Created: {formatDate(listData.createdAt)}</span>
            </div>
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              <span className="text-sm">Due: {formatDate(listData.dueDate)}</span>
            </div>
          </div>
        </div>
        <Badge variant={isOverdue(listData.dueDate) ? "destructive" : "outline"} className="text-sm">
          {isOverdue(listData.dueDate) ? "Overdue" : "Active"}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tasks</CardTitle>
          <CardDescription>Manage your tasks for this list</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Add new task input */}
            <div className="flex items-center space-x-2">
              <Input
                placeholder="Add a new task..."
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    addNewTask()
                  }
                }}
              />
              <Button onClick={addNewTask}>
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>

            {/* Task list */}
            <div className="space-y-4">
              {tasks.map((task) => (
                <Card key={task.id} className="overflow-hidden">
                  <div className="p-4 flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id={task.id}
                        checked={task.completed}
                        onCheckedChange={() => toggleTaskCompletion(task.id)}
                        className="mt-1"
                      />
                      <div className="space-y-1">
                        <label
                          htmlFor={task.id}
                          className={`font-medium ${task.completed ? "line-through text-muted-foreground" : ""}`}
                        >
                          {task.title}
                        </label>
                        <p className="text-sm text-muted-foreground">{task.description}</p>
                        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                          <div className="flex items-center">
                            <CalendarDays className="h-3 w-3 mr-1" />
                            <span>Created: {formatDate(task.createdAt)}</span>
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            <span className={isOverdue(task.dueDate) && !task.completed ? "text-destructive" : ""}>
                              Due: {formatDate(task.dueDate)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeTask(task.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))}

              {tasks.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No tasks yet. Add your first task above!</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
