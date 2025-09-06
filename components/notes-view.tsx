"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Pin, Trash2, Filter, PenTool } from "lucide-react"

interface Note {
  _id: string
  title: string
  content: string
  priority: string
  pinned: boolean
  tags: string[]
  createdAt: string
}

interface NotesViewProps {
  searchQuery: string
  onDataChanged?: () => void
}

export default function NotesView({ searchQuery, onDataChanged }: NotesViewProps) {
  const [notes, setNotes] = useState<Note[]>([])
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newNote, setNewNote] = useState({
    title: "",
    content: "",
    priority: "Medium",
    tags: "",
  })
  const [filterPriority, setFilterPriority] = useState("All")
  const [loading, setLoading] = useState(false)

  // Fetch notes from backend
  useEffect(() => {
    fetchNotes()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchNotes = async () => {
    setLoading(true)
    const res = await fetch("/api/notes")
    if (res.ok) {
      const data = await res.json()
      setNotes(data)
    }
    setLoading(false)
  }

  const handleCreateNote = async () => {
    if (newNote.title.trim()) {
      const note = {
        title: newNote.title,
        content: newNote.content,
        priority: newNote.priority,
        pinned: false,
        tags: newNote.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag),
      }
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(note),
      })
      if (res.ok) {
        const savedNote = await res.json()
        setNotes([savedNote, ...notes])
        setNewNote({ title: "", content: "", priority: "Medium", tags: "" })
        setIsCreateDialogOpen(false)
        if (onDataChanged) onDataChanged()
      }
    }
  }

  const togglePin = async (id: string, pinned: boolean) => {
    await fetch("/api/notes", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, pinned: !pinned }),
    })
    setNotes(notes.map((note) => (note._id === id ? { ...note, pinned: !pinned } : note)))
    if (onDataChanged) onDataChanged()
  }

  const deleteNote = async (id: string) => {
    await fetch(`/api/notes?id=${id}`, {
      method: "DELETE",
    })
    setNotes(notes.filter((note) => note._id !== id))
    if (onDataChanged) onDataChanged()
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High":
        return "destructive"
      case "Medium":
        return "default"
      case "Low":
        return "secondary"
      default:
        return "default"
    }
  }

  const filteredNotes = notes
    .filter((note) => {
      const matchesSearch =
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchesFilter = filterPriority === "All" || note.priority === filterPriority

      return matchesSearch && matchesFilter
    })
    .sort((a, b) => {
      if (a.pinned && !b.pinned) return -1
      if (!a.pinned && b.pinned) return 1
      return 0
    })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notes</h1>
          <p className="text-muted-foreground">Organize your thoughts and ideas</p>
        </div>
        <div className="flex gap-2">
          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="w-32">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All</SelectItem>
              <SelectItem value="High">High</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="Low">Low</SelectItem>
            </SelectContent>
          </Select>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Note
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Note</DialogTitle>
                <DialogDescription>Add a new note to your collection</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Note title..."
                  value={newNote.title}
                  onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                />
                <Textarea
                  placeholder="Write your note content here..."
                  value={newNote.content}
                  onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                  rows={6}
                />
                <div className="flex gap-4">
                  <Select
                    value={newNote.priority}
                    onValueChange={(value) => setNewNote({ ...newNote, priority: value })}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Tags (comma separated)"
                    value={newNote.tags}
                    onChange={(e) => setNewNote({ ...newNote, tags: e.target.value })}
                    className="flex-1"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateNote}>Create Note</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Notes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full text-center py-12 text-muted-foreground">Loading...</div>
        ) : (
          filteredNotes.map((note) => (
            <Card key={note._id} className={`relative ${note.pinned ? "ring-2 ring-yellow-500" : ""}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg line-clamp-2">{note.title}</CardTitle>
                    <CardDescription className="text-sm text-muted-foreground">{note.createdAt}</CardDescription>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => togglePin(note._id, note.pinned)}
                    >
                      <Pin className={`w-4 h-4 ${note.pinned ? "fill-yellow-500 text-yellow-500" : ""}`} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => deleteNote(note._id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground line-clamp-3">{note.content}</p>
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-1">
                    {note.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <Badge variant={getPriorityColor(note.priority)} className="text-xs">
                    {note.priority}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {!loading && filteredNotes.length === 0 && (
        <div className="text-center py-12">
          <PenTool className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No notes found</h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery ? "Try adjusting your search or filters" : "Create your first note to get started"}
          </p>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Note
          </Button>
        </div>
      )}
    </div>
  )
}