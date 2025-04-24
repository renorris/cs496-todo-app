"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { CalendarDays, Clock, Plus, Trash2, Pencil } from "lucide-react"
import { useAuth } from "../contexts/authcontext"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

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

// API response types
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

interface AuthContext {
  getAccessToken: () => Promise<string>
}

export function TaskList({ listId }: TaskListProps) {
  const [listData, setListData] = useState<ListData | null>(null)
  const [newTaskTitle, setNewTaskTitle] = useState<string>("")
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const initiallyLoaded = useRef<boolean>(false)
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [newDueDate, setNewDueDate] = useState<string>("")
  const [originalDueDateTime, setOriginalDueDateTime] = useState<string>("")

  const auth = useAuth()

  // Fetch list and tasks from API
  const fetchListData = async () => {
    setLoading(true)
    setError(null)
    try {
      const accessToken = await auth.getAccessToken()
      const listResponse = await fetch(`https://todoapp.reesenorr.is/api/list/${listId}`, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
      })
      if (!listResponse.ok) throw new Error("Failed to fetch list")
      const list: ListResponse = await listResponse.json()

      const tasksResponse = await fetch(`https://todoapp.reesenorr.is/api/list/${listId}/task/`, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
      })
      if (!tasksResponse.ok) throw new Error("Failed to fetch tasks")
      const tasks: TaskResponse[] = await tasksResponse.json()

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
      initiallyLoaded.current = true
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
      const accessToken = await auth.getAccessToken()
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
      if (!response.ok) throw new Error("Failed to create task")
      setNewTaskTitle("")
      await fetchListData()
    } catch (error: unknown) {
      console.error("Error creating task:", error)
    }
  }

  // Toggle task completion via API
  const toggleTaskCompletion = async (taskId: string) => {
    try {
      const accessToken = await auth.getAccessToken()
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
      if (!response.ok) throw new Error("Failed to update task")
      await fetchListData()
    } catch (error: unknown) {
      console.error("Error updating task:", error)
    }
  }

  // Remove task via API
  const removeTask = async (taskId: string) => {
    try {
      const accessToken = await auth.getAccessToken()
      const response = await fetch(`https://todoapp.reesenorr.is/api/list/${listId}/task/${taskId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
        },
      })
      if (!response.ok) throw new Error("Failed to delete task")
      await fetchListData()
    } catch (error: unknown) {
      console.error("Error deleting task:", error)
    }
  }

  // Start editing task due date
  const startEditing = (taskId: string, currentDueDate: string) => {
    const date = new Date(currentDueDate)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    setNewDueDate(`${year}-${month}-${day}`)
    setOriginalDueDateTime(currentDueDate)
    setEditingTaskId(taskId)
  }

  // Handle date change
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewDueDate(e.target.value)
  }

  // Save new due date
  const saveDueDate = async (taskId: string) => {
    if (!newDueDate || !originalDueDateTime) return
    try {
      const accessToken = await auth.getAccessToken()
      const originalDate = new Date(originalDueDateTime)
      const hours = String(originalDate.getUTCHours()).padStart(2, '0')
      const minutes = String(originalDate.getUTCMinutes()).padStart(2, '0')
      const seconds = String(originalDate.getUTCSeconds()).padStart(2, '0')
      const newIsoDate = `${newDueDate}T${hours}:${minutes}:${seconds}Z`
      const response = await fetch(`https://todoapp.reesenorr.is/api/list/${listId}/task/${taskId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          due_date: newIsoDate,
        }),
      })
      if (!response.ok) throw new Error("Failed to update task due date")
      setEditingTaskId(null)
      await fetchListData()
    } catch (error) {
      console.error("Error updating task due date:", error)
    }
  }

  // Cancel editing
  const cancelEdit = () => {
    setEditingTaskId(null)
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

  // Separate tasks into incomplete and completed
  const incompleteTasks = listData.tasks.filter(task => !task.completed)
  const completedTasks = listData.tasks.filter(task => task.completed)

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
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") addNewTask()
                }}
              />
              <Button onClick={addNewTask}>
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>

            {/* Incomplete Tasks */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">To Do</h3>
              {incompleteTasks.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No tasks to do. Add one above!</p>
                </div>
              )}
              {incompleteTasks.map((task) => (
                <Card key={task.uuid} className="overflow-hidden transition-all duration-300 hover:shadow-md">
                  <div className="p-4 flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Checkbox
                              id={task.uuid}
                              checked={task.completed}
                              onCheckedChange={() => toggleTaskCompletion(task.uuid)}
                              className="mt-1 w-6 h-6 border-2 border-green-500 data-[state=checked]:bg-green-500 data-[state=checked]:text-white"
                            />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Mark as complete</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
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
                          {editingTaskId === task.uuid ? (
                            <div className="flex items-center space-x-2">
                              <input
                                type="date"
                                value={newDueDate}
                                onChange={handleDateChange}
                                className="text-xs border rounded p-1"
                              />
                              <Button variant="outline" size="sm" onClick={() => saveDueDate(task.uuid)}>
                                Save
                              </Button>
                              <Button variant="outline" size="sm" onClick={cancelEdit}>
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2">
                              <span className={isOverdue(task.due_date) && !task.completed ? "text-destructive" : ""}>
                                Due: {formatDate(task.due_date)}
                              </span>
                              <Button variant="ghost" size="icon" onClick={() => startEditing(task.uuid, task.due_date)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
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
            </div>

            {/* Completed Tasks */}
            {completedTasks.length > 0 && (
              <div className="space-y-4 mt-8">
                <h3 className="text-lg font-semibold">Done</h3>
                {completedTasks.map((task) => (
                  <Card key={task.uuid} className="overflow-hidden opacity-75 transition-all duration-300 hover:shadow-md">
                    <div className="p-4 flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Checkbox
                                id={task.uuid}
                                checked={task.completed}
                                onCheckedChange={() => toggleTaskCompletion(task.uuid)}
                                className="mt-1 w-6 h-6 border-0 data-[state=checked]:bg-red-200 data-[state=checked]:text-white"
                              />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Mark as incomplete</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
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
                            {editingTaskId === task.uuid ? (
                              <div className="flex items-center space-x-2">
                                <input
                                  type="date"
                                  value={newDueDate}
                                  onChange={handleDateChange}
                                  className="text-xs border rounded p-1"
                                />
                                <Button variant="outline" size="sm" onClick={() => saveDueDate(task.uuid)}>
                                  Save
                                </Button>
                                <Button variant="outline" size="sm" onClick={cancelEdit}>
                                  Cancel
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center space-x-2">
                                <span className={isOverdue(task.due_date) && !task.completed ? "text-destructive" : ""}>
                                  Due: {formatDate(task.due_date)}
                                </span>
                                <Button variant="ghost" size="icon" onClick={() => startEditing(task.uuid, task.due_date)}>
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
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
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}