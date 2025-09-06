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
    const subjects = client.db().collection("subjects")

    const userSubjects = await subjects.find({ userId: session.user.id }).toArray()

    return NextResponse.json(userSubjects)
  } catch (error) {
    console.error("Get subjects error:", error)
    return NextResponse.json({ error: "Failed to fetch subjects" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const subjectData = await request.json()
    const client = await clientPromise
    const subjects = client.db().collection("subjects")

    const newSubject = {
      ...subjectData,
      userId: session.user.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await subjects.insertOne(newSubject)

    return NextResponse.json({ ...newSubject, _id: result.insertedId }, { status: 201 })
  } catch (error) {
    console.error("Create subject error:", error)
    return NextResponse.json({ error: "Failed to create subject" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id, ...updateData } = await request.json()
    console.log("Updating subject:", id, "with data:", updateData)

    const client = await clientPromise
    const subjects = client.db().collection("subjects")

    const result = await subjects.updateOne(
      { _id: new ObjectId(id), userId: session.user.id },
      { $set: { ...updateData, updatedAt: new Date() } },
    )

    console.log("Subject update result:", result)

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Subject updated successfully" })
  } catch (error) {
    console.error("Update subject error:", error)
    return NextResponse.json({ error: "Failed to update subject" }, { status: 500 })
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
      return NextResponse.json({ error: "Subject ID required" }, { status: 400 })
    }

    const client = await clientPromise
    const subjects = client.db().collection("subjects")

    const result = await subjects.deleteOne({
      _id: new ObjectId(id),
      userId: session.user.id,
    })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Subject deleted successfully" })
  } catch (error) {
    console.error("Delete subject error:", error)
    return NextResponse.json({ error: "Failed to delete subject" }, { status: 500 })
  }
}
