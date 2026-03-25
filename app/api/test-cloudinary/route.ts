import { NextResponse } from "next/server"
import { v2 as cloudinary } from "cloudinary"

export const dynamic = 'force-dynamic'

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
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "Not Set",
      api_key: process.env.CLOUDINARY_API_KEY ? "✅ Set" : "❌ Not set",
      api_secret: process.env.CLOUDINARY_API_SECRET ? "✅ Set" : "❌ Not set",
    })
    
    // Only attempt ping if credentials are set to avoid build error in environments without env vars
    if (process.env.CLOUDINARY_CLOUD_NAME && 
        process.env.CLOUDINARY_API_KEY && 
        process.env.CLOUDINARY_API_SECRET && 
        !process.env.CLOUDINARY_CLOUD_NAME.startsWith('your-')) {
        
        // Test the connection
        const result = await cloudinary.api.ping()
        console.log("✅ Cloudinary ping successful:", result)

        // Test upload limits
        const usage = await cloudinary.api.usage()
        console.log("📊 Cloudinary usage:", usage)
    } else {
        console.log("⚠️ Cloudinary credentials missing or default, skipping ping check during build.")
    }

    return NextResponse.json({
      success: true,
      message: "Cloudinary configuration check completed" 
    })
  } catch (error) {
    console.error("❌ Cloudinary test failed:", error)
    return NextResponse.json({ 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 })
  }
}
