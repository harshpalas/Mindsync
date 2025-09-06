import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { uploadToCloudinary } from "@/lib/cloudinary"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function POST(request: NextRequest) {
  console.log("=== CLOUDINARY UPLOAD API ===")

  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session) {
      console.log("❌ No session found")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.log("✅ User authenticated:", session.user.email)

    // Parse form data
    const formData = await request.formData()
    const file = formData.get("file") as File
    const subjectId = formData.get("subjectId") as string

    console.log("📝 Form data received:", {
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type,
      subjectId,
    })

    // Validate inputs
    if (!file) {
      console.log("❌ No file provided")
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (!subjectId) {
      console.log("❌ No subject ID provided")
      return NextResponse.json({ error: "Subject ID required" }, { status: 400 })
    }

    // Check file size (limit to 10MB)
    if (file.size > 10 * 1024 * 1024) {
      console.log("❌ File too large:", file.size)
      return NextResponse.json({ error: "File too large. Maximum size is 10MB." }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ]

    if (!allowedTypes.includes(file.type)) {
      console.log("❌ Invalid file type:", file.type)
      return NextResponse.json(
        { error: "Invalid file type. Supported: Images, PDF, Word docs, Text files" },
        { status: 400 },
      )
    }

    // Check database connection and subject existence
    console.log("🔍 Checking subject in database...")
    const client = await clientPromise
    const subjects = client.db().collection("subjects")

    const currentSubject = await subjects.findOne({
      _id: new ObjectId(subjectId),
      userId: session.user.id,
    })

    if (!currentSubject) {
      console.log("❌ Subject not found:", subjectId)
      return NextResponse.json({ error: "Subject not found or unauthorized" }, { status: 404 })
    }
    console.log("✅ Subject found:", currentSubject.name)

    // Upload to Cloudinary
    console.log("☁️ Starting Cloudinary upload...")
    let uploadResult: { url: string; public_id: string }
    try {
      uploadResult = await uploadToCloudinary(file)
      console.log("✅ Cloudinary upload successful:", uploadResult)
    } catch (uploadError) {
      console.error("❌ Cloudinary upload failed:", uploadError)
      return NextResponse.json(
        {
          error: `Upload failed: ${uploadError.message}`,
          details: "Please check your Cloudinary configuration",
        },
        { status: 500 },
      )
    }

    // Create resource object
    const resource = {
      id: Date.now(),
      name: file.name,
      type: file.type.includes("image") ? "image" : file.type.includes("pdf") ? "pdf" : "file",
      size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      uploadDate: new Date().toISOString().split("T")[0],
      url: uploadResult.url,
      public_id: uploadResult.public_id, // Store for deletion
      originalSize: file.size,
      mimeType: file.type,
    }

    console.log("📦 Created resource object:", resource)

    // Update subject with new resource
    console.log("💾 Updating subject in database...")
    const currentResources = currentSubject.resources || []
    const updatedResources = [...currentResources, resource]

    const updateResult = await subjects.updateOne(
      { _id: new ObjectId(subjectId), userId: session.user.id },
      { $set: { resources: updatedResources, updatedAt: new Date() } },
    )

    console.log("📊 Database update result:", {
      matchedCount: updateResult.matchedCount,
      modifiedCount: updateResult.modifiedCount,
    })

    if (updateResult.matchedCount === 0) {
      console.log("❌ Database update failed - no match")
      return NextResponse.json({ error: "Failed to update subject" }, { status: 500 })
    }

    console.log("✅ Upload completed successfully!")
    return NextResponse.json(
      {
        url: uploadResult.url,
        public_id: uploadResult.public_id,
        resource,
        success: true,
        message: "File uploaded successfully to Cloudinary",
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("💥 Upload API error:", error)
    return NextResponse.json(
      {
        error: `Upload failed: ${error.message}`,
        details: error.stack,
      },
      { status: 500 },
    )
  }
}
