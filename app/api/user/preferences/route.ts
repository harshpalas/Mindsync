import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const preferences = await request.json()

    const client = await clientPromise
    const users = client.db().collection("users")

    const result = await users.updateOne(
      { _id: new ObjectId(session.user.id) },
      {
        $set: {
          preferences,
          updatedAt: new Date(),
        },
      },
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Preferences updated successfully" })
  } catch (error) {
    console.error("Preferences update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
