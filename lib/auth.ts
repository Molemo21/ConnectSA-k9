import * as jose from 'jose';
import bcrypt from "bcryptjs"
import { cookies } from "next/headers"
import { db } from "./db-utils"
import { prisma } from "./prisma"
import type { UserRole } from "@prisma/client"

const JWT_EXPIRES_IN = "7d"

export interface AuthUser {
  id: string
  email: string
  name: string
  role: UserRole
  emailVerified: boolean
  avatar?: string
}

export async function hashPassword(password: string) {
  const saltRounds = 10
  return await bcrypt.hash(password, saltRounds)
}

export async function verifyPassword(password: string, hashedPassword: string) {
  return await bcrypt.compare(password, hashedPassword)
}

export async function signToken(payload: Record<string, any>) {
  const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'secret')

  return await new jose.SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRES_IN)
    .sign(secret)
}

export async function verifyToken(token: string) {
  try {
    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'secret')
    const { payload } = await jose.jwtVerify(token, secret)
    return payload
  } catch (error) {
    return null
  }
}

export async function getCurrentUser(): Promise<(AuthUser & { provider?: { id: string } }) | null> {
  try {
    // Skip during build time
    if (process.env.NEXT_PHASE === 'phase-production-build') {
      console.log('Skipping getCurrentUser during build time');
      return null;
    }

    const cookieStore = await cookies()
    const token = cookieStore.get("auth-token")?.value

    if (!token) return null

    const decoded = await verifyToken(token)
    if (!decoded) return null

    // Verify user still exists and is active
    const user = await db.user.findFirst({
      where: { id: decoded.id as string, isActive: true },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        emailVerified: true,
        avatar: true,
        provider: { select: { id: true } },
      },
    })

    return user as AuthUser & { provider?: { id: string } } | null
  } catch (error) {
    console.error('Error in getCurrentUser:', error);
    return null
  }
}

// Compatibility exports for existing imports in API routes
export async function getCurrentUserSafe() {
  return await getCurrentUser()
}

export async function generateToken(payload: Record<string, any>) {
  return await signToken(payload)
}

export async function requireAdmin(): Promise<AuthUser | null> {
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') return null
  return user
}

export async function getUserFromRequest(request: Request): Promise<AuthUser | null> {
  // Skip during build time
  if (process.env.NODE_ENV === 'production' && process.env.VERCEL === '1' && !process.env.DATABASE_URL) {
    console.log('Skipping getUserFromRequest during build time');
    return null;
  }

  // Check if we're in a browser/Edge runtime environment
  if (typeof window !== 'undefined' || process.env.NEXT_RUNTIME === 'edge') {
    console.log('Skipping getUserFromRequest in browser/Edge runtime');
    return null;
  }

  const cookieHeader = request.headers.get("cookie")
  if (!cookieHeader) return null

  const token = cookieHeader
    .split(";")
    .find(c => c.trim().startsWith("auth-token="))
    ?.split("=")[1]

  if (!token) return null

  const decoded = await verifyToken(token);
  if (!decoded) return null;

  // This function is used in middleware, which runs in the Edge runtime where
  // Prisma is not available. We'll only verify the token here.
  // The full user object will be fetched from the DB in server components/API routes.
  return decoded;
}

export async function setAuthCookie(user: AuthUser) {
  const token = await signToken(user);
  const cookieStore = await cookies();

  // Simplified cookie configuration - no domain restrictions
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    // No domain specified - let browser handle it automatically
  };

  console.log('🍪 Setting auth cookie:', {
    userId: user.id,
    userEmail: user.email,
    cookieDomain: 'auto (no domain specified)',
    secure: cookieOptions.secure,
    sameSite: cookieOptions.sameSite,
    maxAge: cookieOptions.maxAge
  });

  cookieStore.set('auth-token', token, cookieOptions);
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
      if (providerStatus === "INCOMPLETE" || providerStatus === "REJECTED") return "/provider/onboarding"
      if (providerStatus === "PENDING") return "/provider/pending"
      if (providerStatus === "APPROVED") return "/provider/dashboard"
      return "/provider/onboarding"
    case "ADMIN":
      return "/admin"
    default:
      return "/dashboard"
  }
}
