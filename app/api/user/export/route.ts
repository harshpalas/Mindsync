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
    const db = client.db()

    // Get all user data
    const [user, tasks, journal, subjects] = await Promise.all([
      db.collection("users").findOne({ _id: new ObjectId(session.user.id) }),
      db.collection("tasks").find({ userId: session.user.id }).toArray(),
      db.collection("journal").find({ userId: session.user.id }).toArray(),
      db.collection("subjects").find({ userId: session.user.id }).toArray(),
    ])

    const exportData = {
      user: {
        name: user?.name,
        email: user?.email,
        createdAt: user?.createdAt,
        preferences: user?.preferences,
      },
      tasks,
      journal,
      subjects,
      exportedAt: new Date().toISOString(),
    }

    return NextResponse.json(exportData)
  } catch (error) {
    console.error("Export data error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
