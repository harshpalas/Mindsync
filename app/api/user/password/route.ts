import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import bcrypt from "bcryptjs"

import { checkRateLimit, getClientIp } from "@/lib/rate-limit"
import { validatePassword } from "@/lib/validation"

const PASSWORD_CHANGE_LIMIT = 8
const PASSWORD_CHANGE_WINDOW_MS = 10 * 60 * 1000

export async function PUT(request: NextRequest) {
  const ip = getClientIp(request)
  const rateLimit = checkRateLimit(`user-password:${ip}`, PASSWORD_CHANGE_LIMIT, PASSWORD_CHANGE_WINDOW_MS)

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: `Too many requests. Try again in ${rateLimit.retryAfter}s.` },
      { status: 429 }
    )
  }

  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { currentPassword, newPassword } = await request.json()

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Current and new password are required" }, { status: 400 })
    }

    const passwordValidation = validatePassword(String(newPassword))
    if (!passwordValidation.valid) {
      return NextResponse.json({ error: passwordValidation.message }, { status: 400 })
    }

    const client = await clientPromise
    const users = client.db().collection("users")

    const user = await users.findOne({ _id: new ObjectId(session.user.id) })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (!user.password) {
      return NextResponse.json({ error: "Cannot change password for OAuth accounts" }, { status: 400 })
    }

    const isCurrentPasswordValid = await bcrypt.compare(String(currentPassword), user.password)
    if (!isCurrentPasswordValid) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 })
    }

    const hashedNewPassword = await bcrypt.hash(String(newPassword), 12)

    const result = await users.updateOne(
      { _id: new ObjectId(session.user.id) },
      {
        $set: {
          password: hashedNewPassword,
          updatedAt: new Date(),
        },
      }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Failed to update password" }, { status: 500 })
    }

    return NextResponse.json({ message: "Password updated successfully" })
  } catch (error) {
    console.error("Password update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
