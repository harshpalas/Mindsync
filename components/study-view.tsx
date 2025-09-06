"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Plus, BookOpen, CheckCircle, RotateCcw, X, Trash2, Target, Play, RefreshCw } from "lucide-react"

interface StudyViewProps {
  onDataChanged?: () => void
}

export default function StudyView({ onDataChanged }: StudyViewProps) {
  const [subjects, setSubjects] = useState([])
  const [isCreateSubjectOpen, setIsCreateSubjectOpen] = useState(false)
  const [isCreateChapterOpen, setIsCreateChapterOpen] = useState(false)
  const [isAddTopicOpen, setIsAddTopicOpen] = useState(false)
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null)
  const [selectedChapterId, setSelectedChapterId] = useState<number | null>(null)
  const [newSubject, setNewSubject] = useState({ name: "", description: "" })
  const [newChapter, setNewChapter] = useState({ title: "", topics: "" })
  const [newTopic, setNewTopic] = useState("")

  useEffect(() => {
    fetchSubjects()
  }, [])

  const fetchSubjects = async () => {
    try {
      const response = await fetch("/api/subjects")
      if (response.ok) {
        const data = await response.json()
        setSubjects(data)
      }
    } catch (error) {
      console.error("Failed to fetch subjects:", error)
    }
  }

  // Call onDataChanged whenever subjects data changes
  const triggerDataUpdate = () => {
    if (onDataChanged) {
      onDataChanged()
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Studied":
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case "Studying":
        return <Play className="w-4 h-4 text-blue-500" />
      case "Revised":
        return <RefreshCw className="w-4 h-4 text-purple-500" />
      case "Not Started":
        return <Target className="w-4 h-4 text-gray-400" />
      default:
        return <X className="w-4 h-4 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Studied":
        return "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800"
      case "Studying":
        return "bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800"
      case "Revised":
        return "bg-purple-50 border-purple-200 dark:bg-purple-950/20 dark:border-purple-800"
      default:
        return "bg-gray-50 border-gray-200 dark:bg-gray-950/20 dark:border-gray-800"
    }
  }

  const calculateSubjectProgress = (subject: any) => {
    const totalTopics =
      subject.chapters?.reduce((acc: number, chapter: any) => acc + (chapter.topics?.length || 0), 0) || 0
    const studiedTopics =
      subject.chapters?.reduce(
        (acc: number, chapter: any) =>
          acc + (chapter.topics?.filter((topic: any) => topic.status !== "Not Started").length || 0),
        0,
      ) || 0
    return totalTopics > 0 ? Math.round((studiedTopics / totalTopics) * 100) : 0
  }

  const calculateChapterProgress = (chapter: any) => {
    const totalTopics = chapter.topics?.length || 0
    const studiedTopics = chapter.topics?.filter((topic: any) => topic.status !== "Not Started").length || 0
    return totalTopics > 0 ? Math.round((studiedTopics / totalTopics) * 100) : 0
  }

  const updateTopicStatus = async (subjectId: string, chapterId: number, topicId: number, newStatus: string) => {
    const updatedSubjects = subjects.map((subject: any) => {
      if (subject._id === subjectId) {
        return {
          ...subject,
          chapters: subject.chapters?.map((chapter: any) => {
            if (chapter.id === chapterId) {
              return {
                ...chapter,
                topics: chapter.topics?.map((topic: any) => {
                  if (topic.id === topicId) {
                    const revisionCount =
                      newStatus === "Revised" ? (topic.revisionCount || 0) + 1 : topic.revisionCount || 0
                    return { ...topic, status: newStatus, revisionCount }
                  }
                  return topic
                }),
              }
            }
            return chapter
          }),
        }
      }
      return subject
    })

    setSubjects(updatedSubjects)
    triggerDataUpdate() // Trigger real-time update

    try {
      const subject = updatedSubjects.find((s: any) => s._id === subjectId)
      await fetch("/api/subjects", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: subjectId,
          chapters: subject.chapters,
        }),
      })
    } catch (error) {
      console.error("Failed to update topic status:", error)
    }
  }

  const deleteSubject = async (subjectId: string) => {
    try {
      const response = await fetch(`/api/subjects?id=${subjectId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setSubjects(subjects.filter((subject: any) => subject._id !== subjectId))
        triggerDataUpdate() // Trigger real-time update
      }
    } catch (error) {
      console.error("Failed to delete subject:", error)
    }
  }

  // Add Topic to Chapter
  const handleAddTopic = async () => {
    if (!newTopic.trim() || !selectedSubjectId || !selectedChapterId) return
    const subject = subjects.find((s: any) => s._id === selectedSubjectId)
    if (!subject) return
    const chapter = subject.chapters.find((ch: any) => ch.id === selectedChapterId)
    if (!chapter) return

    const topic = {
      id: Date.now(),
      name: newTopic.trim(),
      status: "Not Started",
      revisionCount: 0,
    }
    const updatedTopics = [...(chapter.topics || []), topic]
    const updatedChapters = subject.chapters.map((ch: any) =>
      ch.id === selectedChapterId ? { ...ch, topics: updatedTopics } : ch,
    )

    try {
      const response = await fetch("/api/subjects", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedSubjectId,
          chapters: updatedChapters,
        }),
      })
      if (response.ok) {
        setSubjects((prevSubjects: any) =>
          prevSubjects.map((subject: any) => {
            if (subject._id === selectedSubjectId) {
              return { ...subject, chapters: updatedChapters }
            }
            return subject
          }),
        )
        setNewTopic("")
        setIsAddTopicOpen(false)
        triggerDataUpdate() // Trigger real-time update
      }
    } catch (error) {
      console.error("Failed to add topic:", error)
    }
  }

  // Delete Topic
  const deleteTopic = async (subjectId: string, chapterId: number, topicId: number) => {
    const subject = subjects.find((s: any) => s._id === subjectId)
    if (!subject) return
    const chapter = subject.chapters.find((ch: any) => ch.id === chapterId)
    if (!chapter) return

    const updatedTopics = chapter.topics.filter((topic: any) => topic.id !== topicId)
    const updatedChapters = subject.chapters.map((ch: any) =>
      ch.id === chapterId ? { ...ch, topics: updatedTopics } : ch,
    )

    try {
      const response = await fetch("/api/subjects", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: subjectId,
          chapters: updatedChapters,
        }),
      })
      if (response.ok) {
        setSubjects((prevSubjects: any) =>
          prevSubjects.map((subject: any) => {
            if (subject._id === subjectId) {
              return { ...subject, chapters: updatedChapters }
            }
            return subject
          }),
        )
        triggerDataUpdate() // Trigger real-time update
      }
    } catch (error) {
      console.error("Failed to delete topic:", error)
    }
  }

  // Delete Chapter
  const deleteChapter = async (subjectId: string, chapterId: number) => {
    const subject = subjects.find((s: any) => s._id === subjectId)
    if (!subject) return

    const updatedChapters = subject.chapters.filter((ch: any) => ch.id !== chapterId)

    try {
      const response = await fetch("/api/subjects", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: subjectId,
          chapters: updatedChapters,
        }),
      })
      if (response.ok) {
        setSubjects((prevSubjects: any) =>
          prevSubjects.map((subject: any) => {
            if (subject._id === subjectId) {
              return { ...subject, chapters: updatedChapters }
            }
            return subject
          }),
        )
        triggerDataUpdate() // Trigger real-time update
      }
    } catch (error) {
      console.error("Failed to delete chapter:", error)
    }
  }

  const handleCreateSubject = async () => {
    if (newSubject.name.trim()) {
      try {
        const response = await fetch("/api/subjects", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: newSubject.name,
            description: newSubject.description,
            chapters: [],
          }),
        })

        if (response.ok) {
          const savedSubject = await response.json()
          setSubjects([...subjects, savedSubject])
          setNewSubject({ name: "", description: "" })
          setIsCreateSubjectOpen(false)
          triggerDataUpdate() // Trigger real-time update
        }
      } catch (error) {
        console.error("Failed to create subject:", error)
      }
    }
  }

  const handleCreateChapter = async () => {
    if (newChapter.title.trim() && selectedSubjectId) {
      const topics = newChapter.topics
        .split(",")
        .map((topic, index) => ({
          id: Date.now() + index,
          name: topic.trim(),
          status: "Not Started",
          revisionCount: 0,
        }))
        .filter((topic) => topic.name)

      const chapter = {
        id: Date.now(),
        title: newChapter.title,
        topics,
      }

      try {
        const subject = subjects.find((s: any) => s._id === selectedSubjectId)
        const updatedChapters = [...(subject.chapters || []), chapter]

        const response = await fetch("/api/subjects", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: selectedSubjectId,
            chapters: updatedChapters,
          }),
        })

        if (response.ok) {
          setSubjects((prevSubjects: any) =>
            prevSubjects.map((subject: any) => {
              if (subject._id === selectedSubjectId) {
                return { ...subject, chapters: updatedChapters }
              }
              return subject
            }),
          )

          setNewChapter({ title: "", topics: "" })
          setIsCreateChapterOpen(false)
          setSelectedSubjectId(null)
          triggerDataUpdate() // Trigger real-time update
        }
      } catch (error) {
        console.error("Failed to create chapter:", error)
      }
    }
  }

  const overallStats = {
    totalSubjects: subjects.length,
    totalChapters: subjects.reduce((acc, subject: any) => acc + (subject.chapters?.length || 0), 0),
    totalTopics: subjects.reduce(
      (acc, subject: any) =>
        acc +
        (subject.chapters?.reduce(
          (chapterAcc: number, chapter: any) => chapterAcc + (chapter.topics?.length || 0),
          0,
        ) || 0),
      0,
    ),
    studiedTopics: subjects.reduce(
      (acc, subject: any) =>
        acc +
        (subject.chapters?.reduce(
          (chapterAcc: number, chapter: any) =>
            chapterAcc + (chapter.topics?.filter((topic: any) => topic.status !== "Not Started").length || 0),
          0,
        ) || 0),
      0,
    ),
  }

  const overallProgress =
    overallStats.totalTopics > 0 ? Math.round((overallStats.studiedTopics / overallStats.totalTopics) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Study Tracker</h1>
          <p className="text-muted-foreground">Track your learning progress across subjects</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isCreateSubjectOpen} onOpenChange={setIsCreateSubjectOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Add Subject
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Subject</DialogTitle>
                <DialogDescription>Add a new subject to track</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Subject name (e.g., Mathematics, Physics)"
                  value={newSubject.name}
                  onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
                />
                <Input
                  placeholder="Description (optional)"
                  value={newSubject.description}
                  onChange={(e) => setNewSubject({ ...newSubject, description: e.target.value })}
                />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsCreateSubjectOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateSubject}>Create Subject</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isCreateChapterOpen} onOpenChange={setIsCreateChapterOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Chapter
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Chapter</DialogTitle>
                <DialogDescription>Add a chapter to a subject</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <select
                  className="w-full p-2 border rounded-md bg-background"
                  value={selectedSubjectId || ""}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                >
                  <option value="">Select Subject</option>
                  {subjects.map((subject: any) => (
                    <option key={subject._id} value={subject._id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
                <Input
                  placeholder="Chapter title"
                  value={newChapter.title}
                  onChange={(e) => setNewChapter({ ...newChapter, title: e.target.value })}
                />
                <Input
                  placeholder="Topics (comma separated)"
                  value={newChapter.topics}
                  onChange={(e) => setNewChapter({ ...newChapter, topics: e.target.value })}
                />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsCreateChapterOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateChapter}>Create Chapter</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Enhanced Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Overall Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallProgress}%</div>
            <Progress value={overallProgress} className="mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Subjects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats.totalSubjects}</div>
            <p className="text-xs text-muted-foreground">Total subjects</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Chapters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats.totalChapters}</div>
            <p className="text-xs text-muted-foreground">Total chapters</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Topics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overallStats.studiedTopics}/{overallStats.totalTopics}
            </div>
            <p className="text-xs text-muted-foreground">Studied topics</p>
          </CardContent>
        </Card>
      </div>

      {/* Subjects */}
      <div className="space-y-6">
        {subjects.map((subject: any) => (
          <Card key={subject._id} className="shadow-lg border-l-4 border-l-primary">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    {subject.name}
                  </CardTitle>
                  {subject.description && <CardDescription className="mt-1">{subject.description}</CardDescription>}
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <div className="text-2xl font-bold">{calculateSubjectProgress(subject)}%</div>
                    <p className="text-xs text-muted-foreground">Complete</p>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:bg-destructive/10 bg-transparent"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Subject</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{subject.name}"? This will also delete all chapters and
                          topics.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteSubject(subject._id)}
                          className="bg-destructive hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
              <Progress value={calculateSubjectProgress(subject)} className="mt-2" />
            </CardHeader>
            <CardContent>
              {subject.chapters && subject.chapters.length > 0 ? (
                <Accordion
                  type="multiple"
                  className="w-full"
                  defaultValue={subject.chapters.map((ch: any) => `chapter-${ch.id}`)}
                >
                  {subject.chapters.map((chapter: any) => (
                    <AccordionItem key={chapter.id} value={`chapter-${chapter.id}`}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center justify-between w-full mr-4">
                          <span className="font-medium">{chapter.title}</span>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{calculateChapterProgress(chapter)}% complete</Badge>
                            <div className="w-20">
                              <Progress value={calculateChapterProgress(chapter)} className="h-2" />
                            </div>
                            {/* Add Topic Button */}
                            <Button
                              size="sm"
                              variant="outline"
                              className="ml-2 bg-transparent"
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedSubjectId(subject._id)
                                setSelectedChapterId(chapter.id)
                                setIsAddTopicOpen(true)
                              }}
                            >
                              <Plus className="w-4 h-4 mr-1" />
                              Add Topic
                            </Button>
                            {/* Delete Chapter Button */}
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="ml-2 text-destructive hover:bg-destructive/10 bg-transparent"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Chapter</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{chapter.title}"? This will also delete all topics
                                    in this chapter.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteChapter(subject._id, chapter.id)}
                                    className="bg-destructive hover:bg-destructive/90"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4 pt-4">
                          <h4 className="font-semibold text-lg mb-4">📚 Topics & Study Progress</h4>
                          {chapter.topics?.map((topic: any) => (
                            <div
                              key={topic.id}
                              className={`p-4 border-2 rounded-lg transition-all ${getStatusColor(topic.status)}`}
                            >
                              <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                  {getStatusIcon(topic.status)}
                                  <div>
                                    <span className="font-medium text-lg">{topic.name}</span>
                                    <div className="flex items-center gap-2 mt-1">
                                      <Badge variant="outline" className="text-xs">
                                        {topic.status}
                                      </Badge>
                                      {topic.revisionCount > 0 && (
                                        <Badge variant="secondary" className="text-xs">
                                          {topic.revisionCount} revisions
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                {/* Delete Topic Button */}
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-destructive hover:bg-destructive/10 bg-transparent"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete Topic</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to delete "{topic.name}"?
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => deleteTopic(subject._id, chapter.id, topic.id)}
                                        className="bg-destructive hover:bg-destructive/90"
                                      >
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                              {/* STUDY TRACKING BUTTONS - ALWAYS VISIBLE */}
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                <Button
                                  size="sm"
                                  variant={topic.status === "Studied" ? "default" : "outline"}
                                  className={`w-full ${
                                    topic.status === "Studied"
                                      ? "bg-green-600 hover:bg-green-700 text-white border-green-600"
                                      : "hover:bg-green-100 hover:text-green-800"
                                  }`}
                                  onClick={() => updateTopicStatus(subject._id, chapter.id, topic.id, "Studied")}
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Studied
                                </Button>

                                <Button
                                  size="sm"
                                  variant={topic.status === "Studying" ? "default" : "outline"}
                                  className={`w-full ${
                                    topic.status === "Studying"
                                      ? "bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
                                      : "hover:bg-blue-100 hover:text-blue-800"
                                  }`}
                                  onClick={() => updateTopicStatus(subject._id, chapter.id, topic.id, "Studying")}
                                >
                                  <Play className="w-4 h-4 mr-1" />
                                  Studying
                                </Button>

                                <Button
                                  size="sm"
                                  variant={topic.status === "Revised" ? "default" : "outline"}
                                  className={`w-full ${
                                    topic.status === "Revised"
                                      ? "bg-purple-600 hover:bg-purple-700 text-white border-purple-600"
                                      : "hover:bg-purple-100 hover:text-purple-800"
                                  }`}
                                  onClick={() => updateTopicStatus(subject._id, chapter.id, topic.id, "Revised")}
                                >
                                  <RefreshCw className="w-4 h-4 mr-1" />
                                  Revised
                                </Button>

                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="w-full hover:bg-gray-200 hover:text-gray-900 bg-transparent"
                                  onClick={() => updateTopicStatus(subject._id, chapter.id, topic.id, "Not Started")}
                                >
                                  <RotateCcw className="w-4 h-4 mr-1" />
                                  Reset
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <BookOpen className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No chapters added yet</p>
                  <Button
                    variant="outline"
                    className="mt-2 bg-transparent"
                    onClick={() => {
                      setSelectedSubjectId(subject._id)
                      setIsCreateChapterOpen(true)
                    }}
                  >
                    Add Chapter
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add Topic Dialog */}
      <Dialog open={isAddTopicOpen} onOpenChange={setIsAddTopicOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Topic</DialogTitle>
            <DialogDescription>Add a new topic to this chapter</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Topic name" value={newTopic} onChange={(e) => setNewTopic(e.target.value)} />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAddTopicOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddTopic}>Add Topic</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {subjects.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No subjects yet</h3>
          <p className="text-muted-foreground mb-4">Create your first subject to start tracking your studies</p>
          <Button onClick={() => setIsCreateSubjectOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Subject
          </Button>
        </div>
      )}
    </div>
  )
}
