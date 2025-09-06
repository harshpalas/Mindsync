"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import {
  Plus,
  CalendarIcon,
  Smile,
  Frown,
  Meh,
  Zap,
  Heart,
  Coffee,
  Search,
  BookOpen,
  TrendingUp,
  Trash2,
} from "lucide-react"
interface JournalViewProps {
  onDataChanged?: () => void
}
export default function JournalView({ onDataChanged }: JournalViewProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedMoodFilter, setSelectedMoodFilter] = useState("All")
  const [newEntry, setNewEntry] = useState({
    content: "",
    mood: "Neutral",
    title: "",
  })

  const [journalEntries, setJournalEntries] = useState([])

  useEffect(() => {
    fetchJournalEntries()
  }, [])

  const fetchJournalEntries = async () => {
    try {
      const response = await fetch("/api/journal")
      if (response.ok) {
        const entries = await response.json()
        setJournalEntries(entries)
      }
    } catch (error) {
      console.error("Failed to fetch journal entries:", error)
    }
  }

  const moods = [
    {
      name: "Happy",
      icon: Smile,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-50 dark:bg-green-950/50",
      borderColor: "border-green-200 dark:border-green-800",
    },
    {
      name: "Sad",
      icon: Frown,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-950/50",
      borderColor: "border-blue-200 dark:border-blue-800",
    },
    {
      name: "Neutral",
      icon: Meh,
      color: "text-gray-600 dark:text-gray-400",
      bgColor: "bg-gray-50 dark:bg-gray-950/50",
      borderColor: "border-gray-200 dark:border-gray-800",
    },
    {
      name: "Productive",
      icon: Zap,
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-50 dark:bg-purple-950/50",
      borderColor: "border-purple-200 dark:border-purple-800",
    },
    {
      name: "Stressed",
      icon: Coffee,
      color: "text-orange-600 dark:text-orange-400",
      bgColor: "bg-orange-50 dark:bg-orange-950/50",
      borderColor: "border-orange-200 dark:border-orange-800",
    },
    {
      name: "Grateful",
      icon: Heart,
      color: "text-pink-600 dark:text-pink-400",
      bgColor: "bg-pink-50 dark:bg-pink-950/50",
      borderColor: "border-pink-200 dark:border-pink-800",
    },
  ]

  const getMoodData = (mood: string) => {
    return moods.find((m) => m.name === mood) || moods[2]
  }

  const handleCreateEntry = async () => {
  if (newEntry.content.trim()) {
    const entry = {
      date: selectedDate?.toISOString().split("T")[0] || new Date().toISOString().split("T")[0],
      title: newEntry.title || `Entry for ${selectedDate?.toDateString()}`,
      content: newEntry.content,
      mood: newEntry.mood,
      tags: [],
    }

    try {
      const response = await fetch("/api/journal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(entry),
      })

      if (response.ok) {
        const savedEntry = await response.json()
        setJournalEntries([savedEntry, ...journalEntries])
        setNewEntry({ content: "", mood: "Neutral", title: "" })
        setIsCreateDialogOpen(false)
        if (onDataChanged) onDataChanged()
      }
    } catch (error) {
      console.error("Failed to create journal entry:", error)
    }
  }
}

const deleteEntry = async (entryId: string) => {
  try {
    const response = await fetch(`/api/journal?id=${entryId}`, {
      method: "DELETE",
    })

    if (response.ok) {
      setJournalEntries(journalEntries.filter((entry) => entry._id !== entryId))
      if (onDataChanged) onDataChanged()
    }
  } catch (error) {
    console.error("Failed to delete journal entry:", error)
  }
}

  const getStreakDays = () => {
    const today = new Date()
    const entryDates = journalEntries.map((entry) => new Date(entry.date))
    let streak = 0

    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today)
      checkDate.setDate(today.getDate() - i)
      const hasEntry = entryDates.some((date) => date.toDateString() === checkDate.toDateString())

      if (hasEntry) {
        streak++
      } else if (i === 0) {
        continue
      } else {
        break
      }
    }

    return streak
  }

  const hasEntryOnDate = (date: Date) => {
    return journalEntries.some((entry) => new Date(entry.date).toDateString() === date.toDateString())
  }

  const getEntriesForSelectedDate = () => {
    if (!selectedDate) return []
    const selectedDateString = selectedDate.toISOString().split("T")[0]
    return journalEntries.filter((entry) => entry.date === selectedDateString)
  }

  const filteredEntries = journalEntries.filter((entry) => {
    const matchesSearch =
      entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesMood = selectedMoodFilter === "All" || entry.mood === selectedMoodFilter

    return matchesSearch && matchesMood
  })

  const moodStats = moods.map((mood) => ({
    ...mood,
    count: journalEntries.filter((entry) => entry.mood === mood.name).length,
  }))

  const selectedDateEntries = getEntriesForSelectedDate()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Daily Journal</h1>
          <p className="text-muted-foreground">Capture your thoughts and track your emotional journey</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
              <Plus className="w-4 h-4 mr-2" />
              New Entry
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Create Journal Entry
              </DialogTitle>
              <DialogDescription>Record your thoughts for {selectedDate?.toDateString()}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Entry title (optional)"
                value={newEntry.title}
                onChange={(e) => setNewEntry({ ...newEntry, title: e.target.value })}
              />
              <Textarea
                placeholder="How was your day? What are you thinking about? Share your thoughts..."
                value={newEntry.content}
                onChange={(e) => setNewEntry({ ...newEntry, content: e.target.value })}
                rows={8}
                className="resize-none"
              />
              <div>
                <label className="text-sm font-medium mb-3 block">How are you feeling?</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {moods.map((mood) => {
                    const Icon = mood.icon
                    const isSelected = newEntry.mood === mood.name
                    return (
                      <Button
                        key={mood.name}
                        variant={isSelected ? "default" : "outline"}
                        onClick={() => setNewEntry({ ...newEntry, mood: mood.name })}
                        className={`flex items-center gap-2 h-12 ${
                          isSelected ? `${mood.bgColor} ${mood.color} ${mood.borderColor} border-2` : ""
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {mood.name}
                      </Button>
                    )
                  })}
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateEntry}>Save Entry</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/50 border-blue-200 dark:border-blue-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Current Streak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getStreakDays()} days</div>
            <p className="text-xs text-muted-foreground">Keep writing! 🔥</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/50 dark:to-green-900/50 border-green-200 dark:border-green-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Total Entries
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{journalEntries.length}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/50 dark:to-purple-900/50 border-purple-200 dark:border-purple-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CalendarIcon className="w-4 h-4" />
              This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {
                journalEntries.filter((entry) => {
                  const entryDate = new Date(entry.date)
                  const now = new Date()
                  return entryDate.getMonth() === now.getMonth() && entryDate.getFullYear() === now.getFullYear()
                }).length
              }
            </div>
            <p className="text-xs text-muted-foreground">Entries</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-950/50 dark:to-pink-900/50 border-pink-200 dark:border-pink-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Heart className="w-4 h-4" />
              Most Common
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {moodStats.reduce((prev, current) => (prev.count > current.count ? prev : current)).name}
            </div>
            <p className="text-xs text-muted-foreground">Mood</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Section */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5" />
              Calendar
            </CardTitle>
            <CardDescription>Click a date to view entries</CardDescription>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border"
              modifiers={{
                hasEntry: (date) => hasEntryOnDate(date),
              }}
              modifiersStyles={{
                hasEntry: {
                  backgroundColor: "hsl(var(--primary))",
                  color: "hsl(var(--primary-foreground))",
                  fontWeight: "bold",
                },
              }}
            />
            {selectedDate && (
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <h4 className="font-medium">{selectedDate.toDateString()}</h4>
                <p className="text-sm text-muted-foreground">
                  {selectedDateEntries.length} {selectedDateEntries.length === 1 ? "entry" : "entries"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Journal Entries Section */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{selectedDate ? `Entries for ${selectedDate.toDateString()}` : "All Entries"}</CardTitle>
                <CardDescription>
                  {selectedDate
                    ? `${selectedDateEntries.length} ${selectedDateEntries.length === 1 ? "entry" : "entries"} found`
                    : `${filteredEntries.length} ${filteredEntries.length === 1 ? "entry" : "entries"} found`}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search entries..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-48"
                  />
                </div>
                <select
                  value={selectedMoodFilter}
                  onChange={(e) => setSelectedMoodFilter(e.target.value)}
                  className="px-3 py-2 border rounded-md bg-background text-sm"
                >
                  <option value="All">All Moods</option>
                  {moods.map((mood) => (
                    <option key={mood.name} value={mood.name}>
                      {mood.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 max-h-[600px] overflow-y-auto">
            {(selectedDate ? selectedDateEntries : filteredEntries).map((entry) => {
              const moodData = getMoodData(entry.mood)
              const MoodIcon = moodData.icon
              return (
                <div
                  key={entry._id}
                  className={`border-2 rounded-lg p-4 space-y-3 ${moodData.bgColor} ${moodData.borderColor} transition-all hover:shadow-md`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full bg-current ${moodData.color}`} />
                      <div>
                        <h3 className="font-semibold text-lg">{entry.title}</h3>
                        <span className="text-sm text-muted-foreground">{entry.date}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={`flex items-center gap-1 ${moodData.color}`}>
                        <MoodIcon className="w-3 h-3" />
                        {entry.mood}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {new Date(entry.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Entry</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this journal entry? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteEntry(entry._id)}
                              className="bg-destructive hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                  <p className="text-sm leading-relaxed">{entry.content}</p>
                  {entry.tags.length > 0 && (
                    <div className="flex gap-1 flex-wrap">
                      {entry.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}

            {(selectedDate ? selectedDateEntries : filteredEntries).length === 0 && (
              <div className="text-center py-8">
                <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  {selectedDate
                    ? "No entries for this date"
                    : searchQuery || selectedMoodFilter !== "All"
                      ? "No matching entries"
                      : "No entries yet"}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {selectedDate
                    ? "Create your first entry for this date"
                    : searchQuery || selectedMoodFilter !== "All"
                      ? "Try adjusting your search or filter"
                      : "Start your journaling journey today"}
                </p>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Write Entry
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
