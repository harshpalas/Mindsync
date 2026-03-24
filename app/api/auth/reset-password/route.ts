import { type NextRequest, NextResponse } from "next/server"
import { createHash } from "crypto"
import bcrypt from "bcryptjs"
import { ObjectId } from "mongodb"

import { clearCredentialFailures } from "@/lib/auth-security"
import clientPromise, { MONGODB_URI_MISSING_ERROR } from "@/lib/mongodb"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"
import { normalizeEmail, validatePassword } from "@/lib/validation"

const RESET_PASSWORD_LIMIT = 8
const RESET_PASSWORD_WINDOW_MS = 10 * 60 * 1000

export async function POST(request: NextRequest) {
  const ip = getClientIp(request)
  const rateLimit = checkRateLimit(`reset-password:${ip}`, RESET_PASSWORD_LIMIT, RESET_PASSWORD_WINDOW_MS)

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: `Too many requests. Try again in ${rateLimit.retryAfter}s.` },
      { status: 429 }
    )
  }

  try {
    const body = await request.json()
    const token = typeof body?.token === "string" ? body.token.trim() : ""
    const newPassword = typeof body?.newPassword === "string" ? body.newPassword : ""

    if (!token) {
      return NextResponse.json({ error: "Invalid reset token" }, { status: 400 })
    }

    const passwordValidation = validatePassword(newPassword)
    if (!passwordValidation.valid) {
      return NextResponse.json({ error: passwordValidation.message }, { status: 400 })
    }

    const tokenHash = createHash("sha256").update(token).digest("hex")

    const client = await clientPromise
    const db = client.db()
    const users = db.collection("users")
    const passwordResets = db.collection("password_resets")

    const resetRecord = await passwordResets.findOne({
      tokenHash,
      used: false,
      expiresAt: { $gt: new Date() },
    })

    if (!resetRecord) {
      return NextResponse.json({ error: "This reset link is invalid or expired" }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12)
    const userId = resetRecord.userId instanceof ObjectId ? resetRecord.userId : new ObjectId(resetRecord.userId)

    const updateResult = await users.updateOne(
      { _id: userId },
      {
        $set: {
          password: hashedPassword,
          updatedAt: new Date(),
        },
      }
    )

    if (updateResult.matchedCount === 0) {
      return NextResponse.json({ error: "User not found for this reset token" }, { status: 404 })
    }

    await passwordResets.updateOne(
      { _id: resetRecord._id },
      {
        $set: {
          used: true,
          usedAt: new Date(),
        },
      }
    )

    const resetEmail = typeof resetRecord.email === "string" ? normalizeEmail(resetRecord.email) : ""
    if (resetEmail) {
      clearCredentialFailures(resetEmail)
    }

    return NextResponse.json({ message: "Password reset successful" }, { status: 200 })
  } catch (error) {
    console.error("Reset password error:", error)

    const errorMessage = error instanceof Error ? error.message : String(error)
    if (errorMessage.includes("MONGODB_URI")) {
      return NextResponse.json(
        {
          error: "Database configuration error.",
          details: MONGODB_URI_MISSING_ERROR,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
