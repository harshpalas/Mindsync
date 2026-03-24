import { type NextRequest, NextResponse } from "next/server"
import { randomBytes, createHash } from "crypto"
import { ObjectId } from "mongodb"

import clientPromise, { MONGODB_URI_MISSING_ERROR } from "@/lib/mongodb"
import { sendPasswordResetEmail } from "@/lib/mailer"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"
import { emailLookupQuery, normalizeEmail, validateEmail } from "@/lib/validation"

const FORGOT_PASSWORD_LIMIT = 5
const FORGOT_PASSWORD_WINDOW_MS = 10 * 60 * 1000
const RESET_TOKEN_TTL_MS = 15 * 60 * 1000

const GENERIC_OK_MESSAGE = "If an account with that email exists, reset instructions were sent."

export async function POST(request: NextRequest) {
  const ip = getClientIp(request)
  const rateLimit = checkRateLimit(`forgot-password:${ip}`, FORGOT_PASSWORD_LIMIT, FORGOT_PASSWORD_WINDOW_MS)

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: `Too many requests. Try again in ${rateLimit.retryAfter}s.` },
      { status: 429 }
    )
  }

  try {
    const body = await request.json()
    const rawEmail = typeof body?.email === "string" ? body.email : ""
    const normalizedEmail = normalizeEmail(rawEmail)

    if (!validateEmail(normalizedEmail)) {
      return NextResponse.json({ message: GENERIC_OK_MESSAGE }, { status: 200 })
    }

    const client = await clientPromise
    const db = client.db()
    const users = db.collection("users")
    const passwordResets = db.collection("password_resets")

    const user = await users.findOne(emailLookupQuery(normalizedEmail))

    if (!user) {
      return NextResponse.json({ message: GENERIC_OK_MESSAGE }, { status: 200 })
    }

    const token = randomBytes(32).toString("hex")
    const tokenHash = createHash("sha256").update(token).digest("hex")
    const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS)

    await passwordResets.updateMany(
      { userId: user._id, used: false },
      { $set: { used: true, revokedAt: new Date() } }
    )

    await passwordResets.insertOne({
      userId: new ObjectId(user._id),
      email: normalizeEmail(String(user.email || normalizedEmail)),
      tokenHash,
      used: false,
      createdAt: new Date(),
      expiresAt,
    })

    const nextAuthUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"
    const resetUrl = `${nextAuthUrl}/auth/reset-password?token=${token}`

    await sendPasswordResetEmail({
      to: String(user.email || normalizedEmail),
      resetUrl,
    })

    return NextResponse.json({ message: GENERIC_OK_MESSAGE }, { status: 200 })
  } catch (error) {
    console.error("Forgot password error:", error)

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

    if (errorMessage.includes("SMTP")) {
      return NextResponse.json(
        {
          error: "Email service is not configured. Set SMTP_* values in .env.local.",
        },
        { status: 500 }
      )
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
