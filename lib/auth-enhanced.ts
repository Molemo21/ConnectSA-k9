import * as jose from 'jose';
import bcrypt from "bcryptjs"
import { cookies } from "next/headers"
import { db } from "./db-utils"
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
    if (process.env.NODE_ENV === 'production' && process.env.VERCEL === '1' && !process.env.DATABASE_URL) {
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

// Enhanced cookie configuration for better compatibility
export async function setAuthCookie(user: AuthUser) {
  const token = await signToken(user);
  const cookieStore = await cookies();

  // Enhanced cookie domain configuration
  let cookieDomain = undefined;
  
  if (process.env.COOKIE_DOMAIN) {
    // Handle different domain configurations
    const domain = process.env.COOKIE_DOMAIN.trim();
    
    if (domain === 'app.proliinkconnect.co.za') {
      // For exact domain match, let browser handle it automatically
      cookieDomain = undefined;
      console.log('Cookie domain set to automatic (browser default) for better compatibility');
    } else if (domain.startsWith('.')) {
      // For subdomain sharing (e.g., .proliinkconnect.co.za)
      cookieDomain = domain;
      console.log('Cookie domain set to subdomain sharing:', domain);
    } else {
      // For other configurations, use as-is
      cookieDomain = domain;
      console.log('Cookie domain set to:', domain);
    }
  }

  const cookieConfig = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: '/',
    domain: cookieDomain,
    maxAge: 60 * 60 * 24 * 7, // 7 days
  };

  console.log('Setting auth cookie with config:', {
    httpOnly: cookieConfig.httpOnly,
    secure: cookieConfig.secure,
    sameSite: cookieConfig.sameSite,
    path: cookieConfig.path,
    domain: cookieConfig.domain,
    maxAge: cookieConfig.maxAge
  });

  cookieStore.set('auth-token', token, cookieConfig);
}

export async function clearAuthCookie() {
  const cookieStore = await cookies()
  cookieStore.delete("auth-token")
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

export async function getUserDashboardPath(role: UserRole, emailVerified: boolean, providerStatus?: string): string {
  if (!emailVerified) {
    return "/verify-email"
  }

  switch (role) {
    case "ADMIN":
      return "/admin/dashboard"
    case "PROVIDER":
      if (!providerStatus) {
        return "/provider/onboarding"
      }
      switch (providerStatus) {
        case "INCOMPLETE":
        case "REJECTED":
          return "/provider/onboarding"
        case "PENDING":
          return "/provider/pending"
        case "APPROVED":
        case "ACTIVE":
          return "/provider/dashboard"
        default:
          return "/provider/onboarding"
      }
    case "CLIENT":
    default:
      return "/dashboard"
  }
}

export async function requireAdmin(): Promise<AuthUser | null> {
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') return null
  return user
}

// Compatibility exports for existing imports in API routes
export async function getCurrentUserSafe() {
  return await getCurrentUser()
}

export async function generateToken(payload: Record<string, any>) {
  return await signToken(payload)
}
