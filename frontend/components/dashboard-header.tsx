"use client"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LogOut } from "lucide-react"
import { useRouter } from "next/navigation"
import dynamic from 'next/dynamic';
import { Bell } from "lucide-react"

import { useAuth } from "@/contexts/authcontext"
import { ThemeSwitcherButton } from '@/components/ThemeSwitcherButton';

// DEFINE User-Menu Dropdown Component so that we avoid rendering before user credentials are stored
const UserMenuComponent = () => {
  const router = useRouter();
  const auth = useAuth();

  // Helper function to get initials
  const getInitials = (name: string | undefined | null): string => {
    if (!name) return '';
    const names = name.split(' ');
    const initials = names[0]?.charAt(0) + (names.length > 1 ? names[names.length - 1]?.charAt(0) : '');
    return initials.toUpperCase();
  };

  const userName = auth.user?.name;
  const userEmail = auth.user?.email;
  const userInitials = getInitials(userName);

  return (
    <>
       <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Notifications">
                <Bell className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <span>Nothing to see here!</span>
                  <img src="/funny_dog.jpg"></img>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src="/placeholder.svg" alt={userName ? `${userName}'s Avatar` : 'User Avatar'} />
            <AvatarFallback>{auth.user ? userInitials : '?'}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
         {/* User Info */}
         {userName && userEmail && (
                <>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      {/* Display user's full name from auth context */}
                      <p className="text-sm font-medium leading-none">{userName}</p>
                      {/* Display user's email from auth context */}
                      <p className="text-xs leading-none text-muted-foreground">
                        {userEmail}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                </>
              )}
          <DropdownMenuItem
            // Use the logout function from the auth context
            onClick={() => {
              auth.logout(); // Call the logout function from context
              router.push("/"); // Redirect to home/login page after logout
            }}
            className="cursor-pointer"
           >
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
       </DropdownMenuContent>
      </DropdownMenu>
    </>
  );

};

// Dynamically import the locally defined UserMenuComponent
const UserMenu = dynamic(
  () => Promise.resolve(UserMenuComponent), // Resolve promise with the component itself
  {
    ssr: false, // *** Still disable SSR ***
  }
);

export function DashboardHeader() {
  const router = useRouter()
  const auth = useAuth();
  const getInitials = (name: string | undefined | null): string => {
    if (!name) return ''; // Return empty string if name is not provided
    const names = name.split(' ');
    // Get the first letter of the first name, and if available, the first letter of the last name
    const initials = names[0]?.charAt(0) + (names.length > 1 ? names[names.length - 1]?.charAt(0) : '');
    return initials.toUpperCase(); // Return uppercase initials
  };

  // Get user details safely using optional chaining
  const userName = auth.user?.name;
  const userEmail = auth.user?.email;

  return (
    <header className="border-b">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div
            className="cursor-pointer" // Add cursor-pointer for visual feedback
            onClick={() => router.push("/dashboard/")} // Add onClick handler
            role="button" // Add role for accessibility
            tabIndex={0} // Make it focusable
          >
            <h2 className="text-xl font-bold">TaskDocker</h2>
        </div>
        <div className="flex items-center gap-4">
          <ThemeSwitcherButton />
          <UserMenu />
        </div>
      </div>
    </header>
  )
}
