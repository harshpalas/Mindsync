import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const client = await clientPromise
    const notes = client.db().collection("notes")

    const entries = await notes.find({ userId: session.user.id }).sort({ pinned: -1, createdAt: -1 }).toArray()

    return NextResponse.json(entries)
  } catch (error) {
    console.error("Get notes error:", error)
    return NextResponse.json({ error: "Failed to fetch notes" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const noteData = await request.json()
    const client = await clientPromise
    const notes = client.db().collection("notes")

    const newNote = {
      ...noteData,
      userId: session.user.id,
      createdAt: new Date().toISOString().split("T")[0],
    }

    const result = await notes.insertOne(newNote)

    return NextResponse.json({ ...newNote, _id: result.insertedId }, { status: 201 })
  } catch (error) {
    console.error("Create note error:", error)
    return NextResponse.json({ error: "Failed to create note" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Note ID required" }, { status: 400 })
    }

    const client = await clientPromise
    const notes = client.db().collection("notes")

    const result = await notes.deleteOne({
      _id: new ObjectId(id),
      userId: session.user.id,
    })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Note deleted successfully" })
  } catch (error) {
    console.error("Delete note error:", error)
    return NextResponse.json({ error: "Failed to delete note" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const updateData = await request.json()
    const { id, ...fields } = updateData

    if (!id) {
      return NextResponse.json({ error: "Note ID required" }, { status: 400 })
    }

    const client = await clientPromise
    const notes = client.db().collection("notes")

    const result = await notes.updateOne(
      { _id: new ObjectId(id), userId: session.user.id },
      { $set: fields }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Note updated successfully" })
  } catch (error) {
    console.error("Update note error:", error)
    return NextResponse.json({ error: "Failed to update note" }, { status: 500 })
  }
}