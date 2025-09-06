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
    const journal = client.db().collection("journal")

    const entries = await journal.find({ userId: session.user.id }).sort({ date: -1 }).toArray()

    return NextResponse.json(entries)
  } catch (error) {
    console.error("Get journal entries error:", error)
    return NextResponse.json({ error: "Failed to fetch journal entries" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const entryData = await request.json()
    const client = await clientPromise
    const journal = client.db().collection("journal")

    const newEntry = {
      ...entryData,
      userId: session.user.id,
      createdAt: new Date(),
    }

    const result = await journal.insertOne(newEntry)

    return NextResponse.json({ ...newEntry, _id: result.insertedId }, { status: 201 })
  } catch (error) {
    console.error("Create journal entry error:", error)
    return NextResponse.json({ error: "Failed to create journal entry" }, { status: 500 })
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
      return NextResponse.json({ error: "Entry ID required" }, { status: 400 })
    }

    const client = await clientPromise
    const journal = client.db().collection("journal")

    const result = await journal.deleteOne({
      _id: new ObjectId(id),
      userId: session.user.id,
    })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Entry deleted successfully" })
  } catch (error) {
    console.error("Delete journal entry error:", error)
    return NextResponse.json({ error: "Failed to delete entry" }, { status: 500 })
  }
}
