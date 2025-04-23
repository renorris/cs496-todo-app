"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { CalendarDays, Clock, Plus, Trash2 } from "lucide-react"
import { useAuth } from "../contexts/authcontext"

// Define interfaces for data structures
interface Task {
  uuid: string
  title: string
  description: string
  created_at: string
  due_date: string
  completed: boolean
}

interface ListData {
  uuid: string
  title: string
  created_at: string
  due_date: string
  tasks: Task[]
}

// API response types (based on assumed structure)
interface ListResponse {
  uuid: string
  title: string
  created_at: string
  due_date: string
}

interface TaskResponse {
  uuid: string
  title: string
  description: string
  created_at: string
  due_date: string
  done: boolean
}

interface TaskListProps {
  listId: string
}

// Assume auth context type
interface AuthContext {
  getAccessToken: () => Promise<string>
}

export function TaskList({ listId }: TaskListProps) {
  const [listData, setListData] = useState<ListData | null>(null)
  const [newTaskTitle, setNewTaskTitle] = useState<string>("")
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const initiallyLoaded = useRef<boolean>(false);

  const auth = useAuth();

  // Fetch list and tasks from API
  const fetchListData = async () => {
    setLoading(true)
    setError(null)
    try {
      const accessToken = await auth.getAccessToken()
      // Fetch list details
      const listResponse = await fetch(`https://todoapp.reesenorr.is/api/list/${listId}`, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
      })
      if (!listResponse.ok) {
        throw new Error("Failed to fetch list")
      }
      const list: ListResponse = await listResponse.json()

      // Fetch tasks
      const tasksResponse = await fetch(`https://todoapp.reesenorr.is/api/list/${listId}/task/`, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
      })
      if (!tasksResponse.ok) {
        throw new Error("Failed to fetch tasks")
      }
      const tasks: TaskResponse[] = await tasksResponse.json()

      // Map API response to component's expected format
      setListData({
        uuid: list.uuid,
        title: list.title,
        created_at: list.created_at,
        due_date: list.due_date,
        tasks: tasks.map((task) => ({
          uuid: task.uuid,
          title: task.title,
          description: task.description,
          created_at: task.created_at,
          due_date: task.due_date,
          completed: task.done,
        })),
      })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      initiallyLoaded.current = true;
      setLoading(false)
    }
  }

  // Fetch data when component mounts or listId changes
  useEffect(() => {
    fetchListData()
  }, [listId])

  // Add new task via API
  const addNewTask = async () => {
    if (newTaskTitle.trim() === "") return
    try {
      const accessToken: string = await (auth as AuthContext).getAccessToken()
      const dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      const response = await fetch(`https://todoapp.reesenorr.is/api/list/${listId}/task/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          title: newTaskTitle,
          description: "",
          due_date: dueDate,
          done: false,
        }),
      })
      if (!response.ok) {
        throw new Error("Failed to create task")
      }
      setNewTaskTitle("")
      await fetchListData() // Refetch data after adding task
    } catch (error: unknown) {
      console.error("Error creating task:", error)
    }
  }

  // Toggle task completion via API
  const toggleTaskCompletion = async (taskId: string) => {
    try {
      const accessToken: string = await (auth as AuthContext).getAccessToken()
      const task = listData?.tasks.find((t) => t.uuid === taskId)
      if (!task) return
      const response = await fetch(`https://todoapp.reesenorr.is/api/list/${listId}/task/${taskId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          done: !task.completed,
        }),
      })
      if (!response.ok) {
        throw new Error("Failed to update task")
      }
      await fetchListData() // Refetch data after updating task
    } catch (error: unknown) {
      console.error("Error updating task:", error)
    }
  }

  // Remove task via API
  const removeTask = async (taskId: string) => {
    try {
      const accessToken: string = await (auth as AuthContext).getAccessToken()
      const response = await fetch(`https://todoapp.reesenorr.is/api/list/${listId}/task/${taskId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
        },
      })
      if (!response.ok) {
        throw new Error("Failed to delete task")
      }
      await fetchListData() // Refetch data after deleting task
    } catch (error: unknown) {
      console.error("Error deleting task:", error)
    }
  }

  // Format date for display
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  // Check if a date is overdue
  const isOverdue = (dueDate: string): boolean => {
    return new Date(dueDate) < new Date()
  }

  // Handle loading and error states
  if (loading && !initiallyLoaded.current) {
    return <div>Loading...</div>
  }
  if (error) {
    return <div>Error: {error}</div>
  }
  if (!listData) {
    return <div>List not found</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{listData.title}</h1>
          <div className="flex items-center mt-2 space-x-4">
            <div className="flex items-center">
              <CalendarDays className="h-4 w-4 mr-1" />
              <span className="text-sm">Created: {formatDate(listData.created_at)}</span>
            </div>
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              <span className="text-sm">Due: {formatDate(listData.due_date)}</span>
            </div>
          </div>
        </div>
        <Badge variant={isOverdue(listData.due_date) ? "destructive" : "outline"} className="text-sm">
          {isOverdue(listData.due_date) ? "Overdue" : "Active"}
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
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTaskTitle(e.target.value)}
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
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
              {listData.tasks.map((task: Task) => (
                <Card key={task.uuid} className="overflow-hidden">
                  <div className="p-4 flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id={task.uuid}
                        checked={task.completed}
                        onCheckedChange={() => toggleTaskCompletion(task.uuid)}
                        className="mt-1"
                      />
                      <div className="space-y-1">
                        <label
                          htmlFor={task.uuid}
                          className={`font-medium ${task.completed ? "line-through text-muted-foreground" : ""}`}
                        >
                          {task.title}
                        </label>
                        <p className="text-sm text-muted-foreground">{task.description}</p>
                        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                          <div className="flex items-center">
                            <CalendarDays className="h-3 w-3 mr-1" />
                            <span>Created: {formatDate(task.created_at)}</span>
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            <span className={isOverdue(task.due_date) && !task.completed ? "text-destructive" : ""}>
                              Due: {formatDate(task.due_date)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeTask(task.uuid)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))}

              {listData.tasks.length === 0 && (
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
