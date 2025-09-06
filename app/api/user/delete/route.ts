import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db()

    // Delete all user data
    await Promise.all([
      db.collection("users").deleteOne({ _id: new ObjectId(session.user.id) }),
      db.collection("tasks").deleteMany({ userId: session.user.id }),
      db.collection("journal").deleteMany({ userId: session.user.id }),
      db.collection("subjects").deleteMany({ userId: session.user.id }),
      db.collection("accounts").deleteMany({ userId: new ObjectId(session.user.id) }),
      db.collection("sessions").deleteMany({ userId: new ObjectId(session.user.id) }),
    ])

    return NextResponse.json({ message: "Account deleted successfully" })
  } catch (error) {
    console.error("Delete account error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
