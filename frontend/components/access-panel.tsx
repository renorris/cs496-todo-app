"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PlusCircle } from "lucide-react"
import { useAuth } from "../contexts/authcontext"
import { set } from "react-hook-form"

interface UserAccess {
  uuid: string
  name: string
  email: string
}

interface AccessPanelProps {
  listId: string
}

export function AccessPanel({ listId }: AccessPanelProps) {
  const [usersAccess, setUsersAccess] = useState<UserAccess[]>([])
  const [newUserEmail, setNewUserEmail] = useState<string>("")
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const auth = useAuth()

  // Fetch users with access when component mounts or listId changes
  useEffect(() => {
    fetchAccessData()
  }, [listId])

  // Fetch users with access from API
  const fetchAccessData = async () => {
    setLoading(true)
    setError(null)
    try {
      const accessToken = await auth.getAccessToken()
      const response = await fetch(`https://todoapp.reesenorr.is/api/list/${listId}/access`, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
      })
      if (!response.ok) {
        throw new Error("Failed to fetch access list")
      }
      const data: UserAccess[] = await response.json()
      setUsersAccess(data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  // Add a new user to the list
  const addUserAccess = async () => {
    if (!newUserEmail.trim()) return
    try {
      const encodedEmail = encodeURIComponent(newUserEmail.trim())
      const accessToken = await auth.getAccessToken()
      const response = await fetch(`https://todoapp.reesenorr.is/api/list/${listId}/access/${encodedEmail}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || "Failed to add user")
      }
      setNewUserEmail("")
      await fetchAccessData()
    } catch (error: unknown) {
      console.error("Error adding user:", error)
      setError(error instanceof Error ? error.message : "An error occurred")
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }
  if (error) {
    return <div>Error: {error}</div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Access Control</CardTitle>
        <CardDescription>Manage who has access to this list</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center space-x-2 mb-4">
            <Input
              placeholder="Enter user email to add"
              value={newUserEmail}
              onChange={(e) => setNewUserEmail(e.target.value)}
            />
            <Button onClick={addUserAccess}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </div>

          {usersAccess.map((user) => (
            <div key={user.uuid} className="flex items-center space-x-3">
              <Avatar>
                <AvatarImage src="/placeholder.svg" alt={user.name} />
                <AvatarFallback>
                  {user.name.charAt(0)}{user.name.split(" ")[1]?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
            </div>
          ))}

          {usersAccess.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>No users with access yet.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}