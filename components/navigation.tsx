"use client"

import { useEffect, useState } from "react"
import { Home, PenTool, Calendar, CheckSquare, BookOpen, Settings, Moon, Sun } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { useTheme } from "next-themes"
import { signOut, useSession } from "next-auth/react"

interface NavigationProps {
  activeView: string
  setActiveView: (view: string) => void
}

export default function Navigation({ activeView, setActiveView }: NavigationProps) {
  const { theme, setTheme } = useTheme()
  const { data: session } = useSession()
  const [userDisplayName, setUserDisplayName] = useState(session?.user?.name || "User")

  // Listen for session updates to update the display name in real-time
  useEffect(() => {
    const handleSessionUpdate = () => {
      if (session?.user?.name) {
        setUserDisplayName(session.user.name)
      }
    }

    // Update when session changes
    if (session?.user?.name) {
      setUserDisplayName(session.user.name)
    }

    // Listen for custom session update events
    window.addEventListener("session-updated", handleSessionUpdate)

    return () => {
      window.removeEventListener("session-updated", handleSessionUpdate)
    }
  }, [session])

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "notes", label: "Notes", icon: PenTool },
    { id: "journal", label: "Journal", icon: Calendar },
    { id: "tasks", label: "Tasks", icon: CheckSquare },
    { id: "study", label: "Study Tracker", icon: BookOpen },
  ]

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">MS</span>
          </div>
          <div>
            <h2 className="font-bold text-lg">MindSync</h2>
            <p className="text-xs text-muted-foreground">Productivity Companion</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.id}>
              <SidebarMenuButton isActive={activeView === item.id} onClick={() => setActiveView(item.id)}>
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>

        <SidebarSeparator />

        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={() => setActiveView("settings")}>
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
              <span className="text-sm font-medium">
                {userDisplayName ? userDisplayName.charAt(0).toUpperCase() : "U"}
              </span>
            </div>
            <div className="text-sm">
              <p className="font-medium">{userDisplayName}</p>
              <p className="text-muted-foreground text-xs">Free Plan</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => signOut()}>
              <span className="text-xs">Logout</span>
            </Button>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
