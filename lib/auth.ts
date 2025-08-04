import * as jose from 'jose';
import bcrypt from "bcryptjs"
import { cookies } from "next/headers"
import { prisma } from "./prisma"
import type { UserRole } from "@prisma/client"

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

export async function generateToken(payload: AuthUser): Promise<string> {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET);
  if (!secret) {
    throw new Error('JWT_SECRET is not defined in the environment.');
  }
  return await new jose.SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRES_IN)
    .sign(secret);
}

export async function verifyToken(token: string): Promise<AuthUser | null> {
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    if (!secret) {
      console.error('JWT_SECRET is not defined in the environment.');
      return null;
    }
    const { payload } = await jose.jwtVerify(token, secret);
    return payload as AuthUser;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

export async function getCurrentUser(): Promise<AuthUser & { provider?: { id: string } } | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth-token")?.value

    if (!token) return null

    const decoded = await verifyToken(token)
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
        provider: { select: { id: true } }, // include provider id
      },
    })

    return user
  } catch {
    return null
  }
}

export async function getUserFromRequest(request: Request): Promise<AuthUser | null> {
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
  const token = await generateToken(user);
  const cookieStore = await cookies();

  cookieStore.set('auth-token', token, {
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
