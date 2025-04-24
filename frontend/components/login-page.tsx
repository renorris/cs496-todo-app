"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Lock } from "lucide-react"

import { useAuth } from '../contexts/authcontext'

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const auth = useAuth();
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const response = await fetch("https://todoapp.reesenorr.is/api/user/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          'email': email,
          'password': password,
        }),
      })

      if (!response.ok) {
        throw new Error("Login failed")
      }

      const data = await response.json()

      const access_token = data['access_token'];
      const refresh_token = data['refresh_token'];

      if (!access_token || !refresh_token) {
          throw new Error("The api is broken uh oh.")
      }

      auth.login(access_token, refresh_token);
      router.push("/dashboard")
    } catch (error) {
      console.error("Login error:", error)
      alert("Invalid login credentials.")
    }
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left side - Login form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
            <CardDescription>Enter your credentials to access your account</CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2 mb-5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full">
                Sign In
              </Button>
              <div className="text-center text-sm">
                Don&apos;t have an account?{" "}
                <a href="/signup" className="text-primary hover:underline">
                  Sign up
                </a>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>

      {/* Right side - Cover image */}
      <div className="flex-1 bg-gradient-to-br from-primary/90 to-primary/70 hidden md:flex flex-col items-center justify-center text-white p-12">
        <div className="max-w-md text-center space-y-6">
          <Lock className="h-16 w-16 mx-auto mb-4" />
          <h1 className="text-3xl font-bold">Containerized To-Do App</h1>
          <p className="text-lg">Organize your tasks efficiently with our Docker-powered task management system.</p>
          <div className="flex flex-col space-y-3 mt-8">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-2" />
              <span>Collaborative task management</span>
            </div>
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-2" />
              <span>Track progress with visual charts</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
