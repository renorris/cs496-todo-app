"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"

// Mock data for users with access
const mockUsersAccess = {
  "1": [
    {
      id: "user1",
      name: "John Doe",
      email: "john.doe@example.com",
      avatar: "/placeholder.svg",
      role: "owner",
    },
    {
      id: "user2",
      name: "Jane Smith",
      email: "jane.smith@example.com",
      avatar: "/placeholder.svg",
      role: "editor",
    },
    {
      id: "user3",
      name: "Bob Johnson",
      email: "bob.johnson@example.com",
      avatar: "/placeholder.svg",
      role: "viewer",
    },
  ],
  "2": [
    {
      id: "user1",
      name: "John Doe",
      email: "john.doe@example.com",
      avatar: "/placeholder.svg",
      role: "owner",
    },
  ],
}

interface AccessPanelProps {
  listId: string
}

export function AccessPanel({ listId }: AccessPanelProps) {
  const users = mockUsersAccess[listId as keyof typeof mockUsersAccess] || []

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "owner":
        return "default"
      case "editor":
        return "secondary"
      case "viewer":
        return "outline"
      default:
        return "outline"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Access Control</CardTitle>
        <CardDescription>Manage who has access to this list</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {users.map((user) => (
            <div key={user.id} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Avatar>
                  <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                  <AvatarFallback>
                    {user.name.charAt(0)}
                    {user.name.split(" ")[1]?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
              </div>
              <Badge variant={getRoleBadgeVariant(user.role)}>
                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              </Badge>
            </div>
          ))}

          <Button variant="outline" className="w-full mt-4">
            <PlusCircle className="h-4 w-4 mr-2" />
            Invite User
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
