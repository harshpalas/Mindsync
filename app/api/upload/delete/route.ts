import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { deleteFromCloudinary } from "@/lib/cloudinary"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function DELETE(request: NextRequest) {
  console.log("=== DELETE CLOUDINARY FILE ===")

  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const subjectId = searchParams.get("subjectId")
    const resourceId = searchParams.get("resourceId")
    const publicId = searchParams.get("publicId")

    if (!subjectId || !resourceId || !publicId) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    console.log("🗑️ Deleting resource:", { subjectId, resourceId, publicId })

    // Delete from Cloudinary first
    try {
      await deleteFromCloudinary(publicId)
      console.log("✅ Deleted from Cloudinary")
    } catch (cloudinaryError) {
      console.error("❌ Cloudinary deletion failed:", cloudinaryError)
      // Continue with database deletion even if Cloudinary fails
    }

    // Remove from database
    const client = await clientPromise
    const subjects = client.db().collection("subjects")

    const currentSubject = await subjects.findOne({
      _id: new ObjectId(subjectId),
      userId: session.user.id,
    })

    if (!currentSubject) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 })
    }

    const updatedResources = currentSubject.resources.filter(
      (resource: any) => resource.id !== Number.parseInt(resourceId),
    )

    const result = await subjects.updateOne(
      { _id: new ObjectId(subjectId), userId: session.user.id },
      { $set: { resources: updatedResources } },
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Failed to update subject" }, { status: 500 })
    }

    console.log("✅ Resource deleted successfully")
    return NextResponse.json({ message: "Resource deleted successfully" })
  } catch (error) {
    console.error("💥 Delete error:", error)
    return NextResponse.json({ error: "Failed to delete resource" }, { status: 500 })
  }
}
