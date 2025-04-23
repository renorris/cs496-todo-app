import LoginPage from "@/components/login-page"

export default function Home() {
  // In a real app, you would check for authentication here
  // If authenticated, redirect to dashboard
  // For demo purposes, we'll just show the login page

  // Uncomment to enable redirect when auth is implemented
  // const isAuthenticated = false;
  // if (isAuthenticated) {
  //   redirect("/dashboard");
  // }

  return <LoginPage />
}
