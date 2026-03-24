import type { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import { MongoDBAdapter } from "@auth/mongodb-adapter"
import bcrypt from "bcryptjs"

import {
  clearCredentialFailures,
  isCredentialsTemporarilyLocked,
  recordCredentialFailure,
} from "@/lib/auth-security"
import clientPromise from "@/lib/mongodb"
import { emailLookupQuery, normalizeEmail } from "@/lib/validation"

const isConfiguredValue = (value?: string) => Boolean(value && !value.startsWith("your-"))

const hasMongo = Boolean(process.env.MONGODB_URI)
const hasGoogle = isConfiguredValue(process.env.GOOGLE_CLIENT_ID) && isConfiguredValue(process.env.GOOGLE_CLIENT_SECRET)
const hasAuthSecret = Boolean(process.env.NEXTAUTH_SECRET)

if (process.env.NODE_ENV === "production" && !isConfiguredValue(process.env.NEXTAUTH_SECRET)) {
  throw new Error("Missing NEXTAUTH_SECRET in production environment")
}

const providers: NextAuthOptions["providers"] = [
  CredentialsProvider({
    name: "credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password || !hasMongo) {
        return null
      }

      const normalizedEmail = normalizeEmail(credentials.email)

      if (isCredentialsTemporarilyLocked(normalizedEmail)) {
        return null
      }

      try {
        const client = await clientPromise
        const users = client.db().collection("users")

        const user = await users.findOne(emailLookupQuery(normalizedEmail))

        if (!user || typeof user.password !== "string") {
          recordCredentialFailure(normalizedEmail)
          return null
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password)

        if (!isPasswordValid) {
          recordCredentialFailure(normalizedEmail)
          return null
        }

        clearCredentialFailures(normalizedEmail)

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
        }
      } catch {
        return null
      }
    },
  }),
]

if (hasGoogle) {
  providers.unshift(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    })
  )
}

export const authOptions: NextAuthOptions = {
  ...(hasMongo ? { adapter: MongoDBAdapter(clientPromise) } : {}),
  providers,
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
  },
  ...(hasAuthSecret ? { secret: process.env.NEXTAUTH_SECRET } : {}),
  pages: {
    signIn: "/auth/signin",
    signUp: "/auth/signup",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
      }
      return session
    },
  },
}

