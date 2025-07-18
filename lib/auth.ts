import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"
import { cookies } from "next/headers"
import { prisma } from "./prisma"
import type { UserRole } from "@prisma/client"

const JWT_SECRET = process.env.JWT_SECRET!
const JWT_EXPIRES_IN = "7d"

export interface AuthUser {
  id: string
  email: string
  name: string
  role: UserRole
  emailVerified: boolean
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export function generateToken(payload: AuthUser): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

export function verifyToken(token: string): AuthUser | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthUser
  } catch {
    return null
  }
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth-token")?.value

    if (!token) return null

    const decoded = verifyToken(token)
    if (!decoded) return null

    // Verify user still exists and is active
    const user = await prisma.user.findFirst({
      where: { id: decoded.id, isActive: true },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        emailVerified: true,
      },
    })

    return user
  } catch {
    return null
  }
}

export async function setAuthCookie(user: AuthUser) {
  const token = generateToken(user)
  const cookieStore = await cookies()

  cookieStore.set("auth-token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  })
}

export async function clearAuthCookie() {
  const cookieStore = await cookies()
  cookieStore.delete("auth-token")
}

export function getUserDashboardPath(role: UserRole, isEmailVerified: boolean, providerStatus?: string): string {
  if (!isEmailVerified) return "/verify-email"

  switch (role) {
    case "CLIENT":
      return "/dashboard"
    case "PROVIDER":
      if (providerStatus === "PENDING") return "/provider/onboarding"
      if (providerStatus === "APPROVED") return "/provider/dashboard"
      return "/provider/pending"
    case "ADMIN":
      return "/admin"
    default:
      return "/dashboard"
  }
}
