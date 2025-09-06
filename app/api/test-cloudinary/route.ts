import { NextResponse } from "next/server"
import { v2 as cloudinary } from "cloudinary"

export async function GET() {
  try {
    console.log("🧪 Testing Cloudinary configuration...")

    // Configure Cloudinary
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    })

    console.log("Configuration:", {
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY ? "✅ Set" : "❌ Not set",
      api_secret: process.env.CLOUDINARY_API_SECRET ? "✅ Set" : "❌ Not set",
    })

    // Test the connection
    const result = await cloudinary.api.ping()
    console.log("✅ Cloudinary ping successful:", result)

    // Test upload limits
    const usage = await cloudinary.api.usage()
    console.log("📊 Cloudinary usage:", usage)

    return NextResponse.json({
      success: true,
      message: "Cloudinary connection successful! 🎉",
      config: {
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key_set: !!process.env.CLOUDINARY_API_KEY,
        api_secret_set: !!process.env.CLOUDINARY_API_SECRET,
      },
      ping_result: result,
      usage: {
        credits: usage.credits,
        used_percent: usage.used_percent,
        limit: usage.limit,
      },
    })
  } catch (error) {
    console.error("❌ Cloudinary test failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        config: {
          cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
          api_key_set: !!process.env.CLOUDINARY_API_KEY,
          api_secret_set: !!process.env.CLOUDINARY_API_SECRET,
        },
        help: "Make sure your .env.local file has the correct Cloudinary credentials",
      },
      { status: 500 },
    )
  }
}
