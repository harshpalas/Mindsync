import { v2 as cloudinary } from "cloudinary"

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export const uploadToCloudinary = async (file: File): Promise<{ url: string; public_id: string }> => {
  try {
    console.log("🚀 Starting Cloudinary upload...")
    console.log("File details:", {
      name: file.name,
      size: file.size,
      type: file.type,
    })

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Clean filename - remove extension for public_id to avoid duplication
    const cleanFileName = file.name.replace(/\.[^/.]+$/, "")
    const timestamp = Date.now()

    return new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            resource_type: "auto",
            folder: "mindsync_uploads",
            public_id: `${timestamp}-${cleanFileName.replace(/[^a-zA-Z0-9]/g, "_")}`,
            use_filename: false, // Don't use original filename
            unique_filename: true,
            overwrite: false,
          },
          (error, result) => {
            if (error) {
              console.error("❌ Cloudinary upload error:", error)
              reject(new Error(`Cloudinary upload failed: ${error.message}`))
            } else if (!result) {
              console.error("❌ No result from Cloudinary")
              reject(new Error("Cloudinary upload failed: No result returned"))
            } else {
              console.log("✅ Cloudinary upload successful:", {
                url: result.secure_url,
                public_id: result.public_id,
              })
              resolve({
                url: result.secure_url,
                public_id: result.public_id,
              })
            }
          },
        )
        .end(buffer)
    })
  } catch (error) {
    console.error("💥 Upload preparation error:", error)
    throw new Error(`Upload preparation failed: ${error.message}`)
  }
}

export const deleteFromCloudinary = async (publicId: string): Promise<void> => {
  try {
    console.log("🗑️ Deleting from Cloudinary:", publicId)
    const result = await cloudinary.uploader.destroy(publicId)
    console.log("✅ Cloudinary delete result:", result)
  } catch (error) {
    console.error("❌ Cloudinary delete error:", error)
    throw new Error(`Failed to delete from Cloudinary: ${error.message}`)
  }
}

export default cloudinary
