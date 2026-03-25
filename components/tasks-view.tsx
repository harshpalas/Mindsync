"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import {
  Plus,
  CalendarIcon,
  Clock,
  Flag,
  CheckSquare,
  MoreHorizontal,
  Play,
  Pause,
  Square,
  Timer,
  Target,
  Trash2,
  ChevronRight,
  ChevronDown,
  Repeat,
  History,
  ArrowLeft,
} from "lucide-react"

interface TasksViewProps {
  onDataChanged?: () => void
}

export default function TasksView({ onDataChanged }: TasksViewProps) {
  const [tasks, setTasks] = useState<any[]>([])
  const [allTasks, setAllTasks] = useState<any[]>([]) // Store all tasks for filtering
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isPomodoroDialogOpen, setIsPomodoroDialogOpen] = useState(false)
  const [isPastTasksDialogOpen, setIsPastTasksDialogOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<any>(null)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [viewingPastTasks, setViewingPastTasks] = useState(false)
  const [pastTasksForDate, setPastTasksForDate] = useState<any[]>([])
  const [pomodoroTime, setPomodoroTime] = useState(25 * 60)
  const [isPomodoroRunning, setIsPomodoroRunning] = useState(false)
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set())
  const timerRef = useRef<any>(null)
  const pomodoroRef = useRef<any>(null)

  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "Medium",
    dueDate: "",
    tags: "",
    category: "Personal",
    estimatedTime: "",
    recurring: {
      enabled: false,
      type: "daily",
      days: [] as string[],
      interval: 1,
    },
    dependencies: [] as string[],
    subtasks: "",
  })

  useEffect(() => {
    fetchTasks()
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (pomodoroRef.current) clearInterval(pomodoroRef.current)
    }
  }, [])

  const fetchTasks = async () => {
    try {
      const response = await fetch("/api/tasks")
      if (response.ok) {
        const data = await response.json()
        setAllTasks(data) // Store all tasks
        filterTasksForToday(data) // Filter for today's tasks
      }
    } catch (error) {
      console.error("Failed to fetch tasks:", error)
    }
  }

  // Filter tasks based on current date and recurring rules
  const filterTasksForToday = (allTasksData: any[]) => {
    const today = new Date()
    const todayStr = today.toISOString().split("T")[0]

    const todaysTasks = allTasksData.filter((task) => {
      // If task has no recurring settings, check if it was created today or has today's due date
      if (!task.recurring) {
        const taskCreatedDate = new Date(task.createdAt || task._id).toISOString().split("T")[0]
        const taskDueDate = task.dueDate

        // Show task if it was created today or due today
        return taskCreatedDate === todayStr || taskDueDate === todayStr
      }

      // Handle recurring tasks
      return shouldShowRecurringTask(task, today)
    })

    setTasks(todaysTasks)
  }

  // Check if a recurring task should be shown on a specific date
  const shouldShowRecurringTask = (task: any, date: Date): boolean => {
    if (!task.recurring) return false

    const taskCreatedDate = new Date(task.createdAt || task._id)
    const checkDate = new Date(date)

    // Don't show task before it was created
    if (checkDate < taskCreatedDate) return false

    const { type, interval, days } = task.recurring

    switch (type) {
      case "daily":
        const daysDiff = Math.floor((checkDate.getTime() - taskCreatedDate.getTime()) / (1000 * 60 * 60 * 24))
        return daysDiff >= 0 && daysDiff % interval === 0

      case "weekly":
        const weeksDiff = Math.floor((checkDate.getTime() - taskCreatedDate.getTime()) / (1000 * 60 * 60 * 24 * 7))
        if (weeksDiff < 0 || weeksDiff % interval !== 0) return false

        if (days && days.length > 0) {
          const dayName = checkDate.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase()
          return days.includes(dayName)
        }
        return checkDate.getDay() === taskCreatedDate.getDay()

      case "monthly":
        const monthsDiff =
          (checkDate.getFullYear() - taskCreatedDate.getFullYear()) * 12 +
          (checkDate.getMonth() - taskCreatedDate.getMonth())
        return monthsDiff >= 0 && monthsDiff % interval === 0 && checkDate.getDate() === taskCreatedDate.getDate()

      default:
        return false
    }
  }

  // Get tasks for a specific past date
  const getTasksForDate = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0]

    const tasksForDate = allTasks.filter((task) => {
      // For non-recurring tasks, check if they were created on this date or due on this date
      if (!task.recurring) {
        const taskCreatedDate = new Date(task.createdAt || task._id).toISOString().split("T")[0]
        const taskDueDate = task.dueDate
        return taskCreatedDate === dateStr || taskDueDate === dateStr
      }

      // For recurring tasks, check if they should appear on this date
      return shouldShowRecurringTask(task, date)
    })

    return tasksForDate
  }

  // Handle calendar date selection
  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return

    setSelectedDate(date)
    const tasksForSelectedDate = getTasksForDate(date)
    setPastTasksForDate(tasksForSelectedDate)
    setViewingPastTasks(true)
  }

  // Format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  // Calculate stats for a given set of tasks
  const calculateTaskStats = (taskList: any[]) => {
    const totalTasks = taskList.length
    const completedTasks = taskList.filter((t) => t.status === "Done").length
    const inProgressTasks = taskList.filter((t) => t.status === "In Progress").length
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      completionRate,
    }
  }

  // Improved timer system
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    const runningTasks = tasks.filter((task) => task.isTimerRunning)
    if (runningTasks.length > 0) {
      timerRef.current = setInterval(() => {
        setTasks((prevTasks) =>
          prevTasks.map((task) => {
            if (task.isTimerRunning) {
              return { ...task, timeSpent: task.timeSpent + 1 }
            }
            return task
          }),
        )
      }, 1000)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [tasks.some((task) => task.isTimerRunning)])

  // Pomodoro timer
  useEffect(() => {
    if (pomodoroRef.current) clearInterval(pomodoroRef.current)
    if (isPomodoroRunning && pomodoroTime > 0) {
      pomodoroRef.current = setInterval(() => {
        setPomodoroTime((time) => {
          if (time <= 1) {
            setIsPomodoroRunning(false)
            if (selectedTask) {
              updateTask(selectedTask._id, { pomodoroSessions: (selectedTask.pomodoroSessions || 0) + 1 })
            }
            alert("Pomodoro session completed! Take a break.")
            return 25 * 60
          }
          return time - 1
        })
      }, 1000)
    }
    return () => {
      if (pomodoroRef.current) clearInterval(pomodoroRef.current)
    }
  }, [isPomodoroRunning, selectedTask])

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`
    }
    return `${minutes}m ${secs}s`
  }

  const formatPomodoroTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const updateTask = async (taskId: string, updates: any) => {
    try {
      const response = await fetch("/api/tasks", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: taskId, ...updates }),
      })
      if (response.ok) {
        // Update both current tasks and all tasks
        setTasks((prevTasks) => prevTasks.map((task) => (task._id === taskId ? { ...task, ...updates } : task)))
        setAllTasks((prevTasks) => prevTasks.map((task) => (task._id === taskId ? { ...task, ...updates } : task)))
        setPastTasksForDate((prevTasks) =>
          prevTasks.map((task) => (task._id === taskId ? { ...task, ...updates } : task)),
        )
        if (onDataChanged) onDataChanged()
      }
    } catch (error) {
      console.error("Failed to update task:", error)
    }
  }

  const toggleTimer = (taskId: string) => {
    const task = tasks.find((t) => t._id === taskId) || pastTasksForDate.find((t) => t._id === taskId)
    const updates = {
      isTimerRunning: !task.isTimerRunning,
      timerStartTime: !task.isTimerRunning ? Date.now() : null,
    }
    updateTask(taskId, updates)
  }

  const toggleSubtask = (taskId: string, subtaskId: string) => {
    const task = tasks.find((t) => t._id === taskId) || pastTasksForDate.find((t) => t._id === taskId)
    const updatedSubtasks = task.subtasks.map((subtask: any) =>
      subtask.id === subtaskId ? { ...subtask, completed: !subtask.completed } : subtask,
    )
    updateTask(taskId, { subtasks: updatedSubtasks })
  }

  const getSubtaskProgress = (subtasks: any[]) => {
    if (!subtasks || subtasks.length === 0) return 0
    const completed = subtasks.filter((st: any) => st.completed).length
    return Math.round((completed / subtasks.length) * 100)
  }

  const toggleTaskExpansion = (taskId: string) => {
    const newExpanded = new Set(expandedTasks)
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId)
    } else {
      newExpanded.add(taskId)
    }
    setExpandedTasks(newExpanded)
  }

  const handleCreateTask = async () => {
    if (newTask.title.trim()) {
      const subtasks = newTask.subtasks
        ? newTask.subtasks
            .split("\n")
            .filter((line) => line.trim())
            .map((line, index) => ({
              id: Date.now() + index,
              title: line.trim(),
              completed: false,
            }))
        : []

      const taskData = {
        title: newTask.title,
        description: newTask.description,
        status: "Todo",
        priority: newTask.priority,
        dueDate: newTask.dueDate,
        tags: newTask.tags
          .split(",")
          .map((tag: string) => tag.trim())
          .filter((tag: string) => tag),
        category: newTask.category,
        estimatedTime: newTask.estimatedTime,
        timeSpent: 0,
        isTimerRunning: false,
        timerStartTime: null,
        pomodoroSessions: 0,
        recurring: newTask.recurring.enabled ? newTask.recurring : null,
        dependencies: newTask.dependencies,
        subtasks,
        createdAt: new Date().toISOString(),
      }

      try {
        const response = await fetch("/api/tasks", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(taskData),
        })
        if (response.ok) {
          const savedTask = await response.json()
          setAllTasks([savedTask, ...allTasks])

          // Only add to current tasks if it should appear today
          const today = new Date()
          if (!savedTask.recurring || shouldShowRecurringTask(savedTask, today)) {
            setTasks([savedTask, ...tasks])
          }

          setNewTask({
            title: "",
            description: "",
            priority: "Medium",
            dueDate: "",
            tags: "",
            category: "Personal",
            estimatedTime: "",
            recurring: {
              enabled: false,
              type: "daily",
              days: [] as string[],
              interval: 1,
            },
            dependencies: [] as string[],
            subtasks: "",
          })
          setIsCreateDialogOpen(false)
          if (onDataChanged) onDataChanged()
        }
      } catch (error) {
        console.error("Failed to create task:", error)
      }
    }
  }

  const updateTaskStatus = (id: string, newStatus: string) => {
    const updates = {
      status: newStatus,
      completedAt: newStatus === "Done" ? new Date().toISOString().split("T")[0] : null,
    }
    updateTask(id, updates)
  }

  const deleteTask = async (id: string) => {
    try {
      const response = await fetch(`/api/tasks?id=${id}`, {
        method: "DELETE",
      })
      if (response.ok) {
        setTasks(tasks.filter((task) => task._id !== id))
        setAllTasks(allTasks.filter((task) => task._id !== id))
        setPastTasksForDate(pastTasksForDate.filter((task) => task._id !== id))
        if (onDataChanged) onDataChanged()
      }
    } catch (error) {
      console.error("Failed to delete task:", error)
    }
  }

  const getRecurringDisplay = (recurring: any) => {
    if (!recurring) return null
    let display = ""
    switch (recurring.type) {
      case "daily":
        display = recurring.interval === 1 ? "Daily" : `Every ${recurring.interval} days`
        break
      case "weekly":
        if (recurring.days && recurring.days.length > 0) {
          display = `Weekly on ${recurring.days.join(", ")}`
        } else {
          display = recurring.interval === 1 ? "Weekly" : `Every ${recurring.interval} weeks`
        }
        break
      case "monthly":
        display = recurring.interval === 1 ? "Monthly" : `Every ${recurring.interval} months`
        break
    }
    return display
  }

  const TaskCard = ({ task, isPastTask = false }: { task: any; isPastTask?: boolean }) => {
    const isExpanded = expandedTasks.has(task._id)
    const subtaskProgress = getSubtaskProgress(task.subtasks)

    return (
      <Card
        className={`transition-all hover:shadow-lg border-l-4 ${
          task.priority === "High"
            ? "border-l-red-400 dark:border-l-red-500"
            : task.priority === "Medium"
              ? "border-l-yellow-400 dark:border-l-yellow-500"
              : "border-l-green-400 dark:border-l-green-500"
        } bg-card ${isPastTask ? "opacity-80" : ""}`}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              <Checkbox
                checked={task.status === "Done"}
                onCheckedChange={(checked) => updateTaskStatus(task._id, checked ? "Done" : "Todo")}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <CardTitle
                    className={`text-lg ${task.status === "Done" ? "line-through text-muted-foreground" : ""}`}
                  >
                    {task.title}
                  </CardTitle>
                  {task.subtasks && task.subtasks.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleTaskExpansion(task._id)}
                      className="p-1 h-6 w-6"
                    >
                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </Button>
                  )}
                  {task.recurring && (
                    <Badge variant="outline" className="text-xs">
                      <Repeat className="w-3 h-3 mr-1" />
                      {getRecurringDisplay(task.recurring)}
                    </Badge>
                  )}
                </div>
                {task.description && <CardDescription className="mt-1">{task.description}</CardDescription>}
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedTask(task)
                    setIsPomodoroDialogOpen(true)
                  }}
                >
                  <Timer className="w-4 h-4 mr-2" />
                  Start Pomodoro
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => toggleTimer(task._id)}>
                  {task.isTimerRunning ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                  {task.isTimerRunning ? "Pause Timer" : "Start Timer"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => deleteTask(task._id)} className="text-destructive">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress Bar for Subtasks */}
          {task.subtasks && task.subtasks.length > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtasks Progress</span>
                <span className="font-medium">
                  {task.subtasks.filter((st: any) => st.completed).length}/{task.subtasks.length} ({subtaskProgress}%)
                </span>
              </div>
              <Progress value={subtaskProgress} className="h-2" />
            </div>
          )}

          {/* Subtasks */}
          {isExpanded && task.subtasks && task.subtasks.length > 0 && (
            <div className="space-y-2 pl-4 border-l-2 border-muted">
              <h4 className="font-medium text-sm text-muted-foreground">Subtasks:</h4>
              {task.subtasks.map((subtask: any) => (
                <div key={subtask.id} className="flex items-center gap-2">
                  <Checkbox
                    checked={subtask.completed}
                    onCheckedChange={() => toggleSubtask(task._id, subtask.id)}
                    className="h-4 w-4"
                  />
                  <span className={`text-sm ${subtask.completed ? "line-through text-muted-foreground" : ""}`}>
                    {subtask.title}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Task Info */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
            {task.dueDate && (
              <div className="flex items-center gap-1">
                <CalendarIcon className="w-4 h-4" />
                {task.dueDate}
              </div>
            )}
            {task.estimatedTime && (
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {task.estimatedTime}
              </div>
            )}
            {task.timeSpent > 0 && (
              <div className="flex items-center gap-1">
                <Timer className="w-4 h-4" />
                {formatTime(task.timeSpent)}
              </div>
            )}
            {task.pomodoroSessions > 0 && (
              <div className="flex items-center gap-1">
                <Target className="w-4 h-4" />
                {task.pomodoroSessions} pomodoros
              </div>
            )}
          </div>

          {/* Timer Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              size="sm"
              variant={task.isTimerRunning ? "destructive" : "default"}
              onClick={() => toggleTimer(task._id)}
            >
              {task.isTimerRunning ? <Pause className="w-4 h-4 mr-1" /> : <Play className="w-4 h-4 mr-1" />}
              {task.isTimerRunning ? "Pause" : "Start"} Timer
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setSelectedTask(task)
                setIsPomodoroDialogOpen(true)
              }}
            >
              <Timer className="w-4 h-4 mr-1" />
              Pomodoro
            </Button>
          </div>

          {/* Tags and Priority */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex flex-wrap gap-1">
              <Badge variant="secondary" className="text-xs">
                {task.category}
              </Badge>
              {task.tags &&
                task.tags.map((tag: any, index: number) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    #{tag}
                  </Badge>
                ))}
            </div>
            <Badge
              variant={task.priority === "High" ? "destructive" : task.priority === "Medium" ? "default" : "secondary"}
              className="text-xs"
            >
              <Flag className="w-3 h-3 mr-1" />
              {task.priority}
            </Badge>
          </div>

          {/* Status Selector */}
          <Select value={task.status} onValueChange={(value) => updateTaskStatus(task._id, value)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Todo">Todo</SelectItem>
              <SelectItem value="In Progress">In Progress</SelectItem>
              <SelectItem value="Done">Done</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
    )
  }

  const currentTasksToShow = viewingPastTasks ? pastTasksForDate : tasks
  const currentStats = viewingPastTasks ? calculateTaskStats(pastTasksForDate) : calculateTaskStats(tasks)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {viewingPastTasks ? `Tasks for ${selectedDate ? formatDate(selectedDate) : ""}` : "Task Manager"}
          </h1>
          <p className="text-muted-foreground">
            {viewingPastTasks ? "Viewing past tasks" : "Organize and track your tasks efficiently"}
          </p>
        </div>
        <div className="flex gap-2">
          {viewingPastTasks && (
            <Button
              variant="outline"
              onClick={() => {
                setViewingPastTasks(false)
                setSelectedDate(undefined)
                setPastTasksForDate([])
              }}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Today
            </Button>
          )}

          <Dialog open={isPastTasksDialogOpen} onOpenChange={setIsPastTasksDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <History className="w-4 h-4 mr-2" />
                Past Tasks
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Select Date</DialogTitle>
                <DialogDescription>Choose a date to view tasks from that day</DialogDescription>
              </DialogHeader>
              <div className="flex justify-center">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    if (date) {
                      handleDateSelect(date)
                      setIsPastTasksDialogOpen(false)
                    }
                  }}
                  disabled={(date) => date > new Date()}
                  className="rounded-md border"
                />
              </div>
            </DialogContent>
          </Dialog>

          {!viewingPastTasks && (
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  New Task
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Task</DialogTitle>
                  <DialogDescription>Add a new task with subtasks and recurring options</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="Task title..."
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  />
                  <Textarea
                    placeholder="Task description..."
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    rows={3}
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Select
                      value={newTask.priority}
                      onValueChange={(value) => setNewTask({ ...newTask, priority: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Low">Low</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="High">High</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select
                      value={newTask.category}
                      onValueChange={(value) => setNewTask({ ...newTask, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Personal">Personal</SelectItem>
                        <SelectItem value="Education">Education</SelectItem>
                        <SelectItem value="Career">Career</SelectItem>
                        <SelectItem value="Health">Health</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      type="date"
                      value={newTask.dueDate}
                      onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                    />
                    <Input
                      placeholder="Estimated time"
                      value={newTask.estimatedTime}
                      onChange={(e) => setNewTask({ ...newTask, estimatedTime: e.target.value })}
                    />
                  </div>
                  <Input
                    placeholder="Tags (comma separated)"
                    value={newTask.tags}
                    onChange={(e) => setNewTask({ ...newTask, tags: e.target.value })}
                  />

                  {/* Recurring Options */}
                  <div className="space-y-3 border rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={newTask.recurring.enabled}
                        onCheckedChange={(checked) =>
                          setNewTask({
                            ...newTask,
                            recurring: { ...newTask.recurring, enabled: checked === true },
                          })
                        }
                      />
                      <label className="font-medium">Make this task recurring</label>
                    </div>
                    {newTask.recurring.enabled && (
                      <div className="space-y-3 ml-6">
                        <Select
                          value={newTask.recurring.type}
                          onValueChange={(value) =>
                            setNewTask({
                              ...newTask,
                              recurring: { ...newTask.recurring, type: value },
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                          </SelectContent>
                        </Select>
                        {newTask.recurring.type === "weekly" && (
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Select days:</label>
                            <div className="grid grid-cols-2 gap-2">
                              {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(
                                (day) => (
                                  <div key={day} className="flex items-center gap-2">
                                    <Checkbox
                                      checked={newTask.recurring.days.includes(day.toLowerCase())}
                                      onCheckedChange={(checked) => {
                                        const days = checked
                                          ? [...newTask.recurring.days, day.toLowerCase()]
                                          : newTask.recurring.days.filter((d) => d !== day.toLowerCase())
                                        setNewTask({
                                          ...newTask,
                                          recurring: { ...newTask.recurring, days },
                                        })
                                      }}
                                    />
                                    <label className="text-sm">{day}</label>
                                  </div>
                                ),
                              )}
                            </div>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <label className="text-sm">Every</label>
                          <Input
                            type="number"
                            min="1"
                            value={newTask.recurring.interval}
                            onChange={(e) =>
                              setNewTask({
                                ...newTask,
                                recurring: { ...newTask.recurring, interval: Number.parseInt(e.target.value) || 1 },
                              })
                            }
                            className="w-20"
                          />
                          <label className="text-sm">
                            {newTask.recurring.type === "daily"
                              ? "day(s)"
                              : newTask.recurring.type === "weekly"
                                ? "week(s)"
                                : "month(s)"}
                          </label>
                        </div>
                      </div>
                    )}
                  </div>

                  <Textarea
                    placeholder="Subtasks (one per line)"
                    value={newTask.subtasks}
                    onChange={(e) => setNewTask({ ...newTask, subtasks: e.target.value })}
                    rows={4}
                  />
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateTask}>Create Task</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Task Stats - Show for both today's tasks and past tasks */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{viewingPastTasks ? "Total Tasks" : "Today's Tasks"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentStats.totalTasks}</div>
            <p className="text-xs text-muted-foreground">
              {viewingPastTasks ? "Tasks for this date" : "Tasks for today"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentStats.completedTasks}</div>
            <p className="text-xs text-muted-foreground">Finished tasks</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentStats.inProgressTasks}</div>
            <p className="text-xs text-muted-foreground">Active tasks</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentStats.completionRate}%</div>
            <p className="text-xs text-muted-foreground">
              {viewingPastTasks ? "Rate for this date" : "Today's completion"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Task List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {currentTasksToShow.map((task) => (
          <TaskCard key={task._id} task={task} isPastTask={viewingPastTasks} />
        ))}
      </div>

      {/* No tasks message */}
      {currentTasksToShow.length === 0 && (
        <div className="text-center py-12">
          <CheckSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">
            {viewingPastTasks
              ? `No tasks found for ${selectedDate ? formatDate(selectedDate) : "this date"}`
              : "No tasks for today"}
          </h3>
          <p className="text-muted-foreground mb-4">
            {viewingPastTasks ? "You had no tasks scheduled for this date." : "Create your first task to get started"}
          </p>
          {!viewingPastTasks && (
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Task
            </Button>
          )}
        </div>
      )}

      {/* Pomodoro Dialog */}
      <Dialog open={isPomodoroDialogOpen} onOpenChange={setIsPomodoroDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pomodoro Timer</DialogTitle>
            <DialogDescription>
              {selectedTask ? `Working on: ${selectedTask.title}` : "Focus session"}
            </DialogDescription>
          </DialogHeader>
          <div className="text-center space-y-4">
            <div className="text-6xl font-bold text-primary">{formatPomodoroTime(pomodoroTime)}</div>
            <div className="flex justify-center gap-2">
              <Button
                onClick={() => setIsPomodoroRunning(!isPomodoroRunning)}
                variant={isPomodoroRunning ? "destructive" : "default"}
              >
                {isPomodoroRunning ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                {isPomodoroRunning ? "Pause" : "Start"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsPomodoroRunning(false)
                  setPomodoroTime(25 * 60)
                }}
              >
                <Square className="w-4 h-4 mr-2" />
                Reset
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
