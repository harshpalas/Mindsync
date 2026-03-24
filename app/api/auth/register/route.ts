import { type NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"

import clientPromise, { MONGODB_URI_MISSING_ERROR } from "@/lib/mongodb"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"
import { emailLookupQuery, normalizeEmail, validateEmail, validateName, validatePassword } from "@/lib/validation"

const REGISTER_LIMIT = 8
const REGISTER_WINDOW_MS = 10 * 60 * 1000

export async function POST(request: NextRequest) {
  const ip = getClientIp(request)
  const rateLimit = checkRateLimit(`register:${ip}`, REGISTER_LIMIT, REGISTER_WINDOW_MS)

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: `Too many requests. Try again in ${rateLimit.retryAfter}s.` },
      { status: 429 }
    )
  }

  try {
    const { name, email, password } = await request.json()

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const trimmedName = String(name).trim()
    const normalizedEmail = normalizeEmail(String(email))
    const rawPassword = String(password)

    if (!validateEmail(normalizedEmail)) {
      return NextResponse.json({ error: "Please enter a valid email address" }, { status: 400 })
    }

    const nameValidation = validateName(trimmedName)
    if (!nameValidation.valid) {
      return NextResponse.json({ error: nameValidation.message }, { status: 400 })
    }

    const passwordValidation = validatePassword(rawPassword)
    if (!passwordValidation.valid) {
      return NextResponse.json({ error: passwordValidation.message }, { status: 400 })
    }

    const client = await clientPromise
    const users = client.db().collection("users")

    const existingUser = await users.findOne(emailLookupQuery(normalizedEmail))
    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(rawPassword, 12)

    const result = await users.insertOne({
      name: trimmedName,
      email: normalizedEmail,
      password: hashedPassword,
      createdAt: new Date(),
      onboarding: {
        completed: false,
        completedAt: null,
      },
    })

    return NextResponse.json({ message: "User created successfully", userId: result.insertedId }, { status: 201 })
  } catch (error) {
    console.error("Registration error:", error)

    const errorMessage = error instanceof Error ? error.message : String(error)
    const isMongoConfigError =
      errorMessage.includes("MONGODB_URI") ||
      errorMessage.includes("ECONNREFUSED") ||
      errorMessage.includes("ENOTFOUND") ||
      errorMessage.includes("querySrv") ||
      errorMessage.includes("authentication failed")

    if (isMongoConfigError) {
      return NextResponse.json(
        {
          error:
            "Database configuration error. Check MONGODB_URI in .env.local and verify your MongoDB server is reachable.",
          details: MONGODB_URI_MISSING_ERROR,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
