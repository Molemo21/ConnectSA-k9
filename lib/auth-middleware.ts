import { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// Middleware-safe interface for user data
export interface MiddlewareUser {
  id: string;
  email: string;
  role: 'CLIENT' | 'PROVIDER' | 'ADMIN';
  emailVerified: boolean;
}

// Middleware-safe token verification (no Prisma dependency)
export async function verifyTokenMiddleware(token: string): Promise<MiddlewareUser | null> {
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    
    if (!payload || typeof payload === 'string') {
      return null;
    }
    
    // Validate required fields
    if (!payload.id || !payload.email || !payload.role) {
      return null;
    }
    
    return {
      id: payload.id as string,
      email: payload.email as string,
      role: payload.role as 'CLIENT' | 'PROVIDER' | 'ADMIN',
      emailVerified: payload.emailVerified as boolean || false,
    };
  } catch (error) {
    return null;
  }
}

// Middleware-safe user extraction from request
export async function getUserFromRequestMiddleware(request: NextRequest): Promise<MiddlewareUser | null> {
  try {
    // Try to get token from cookies
    const token = request.cookies.get('accessToken')?.value;
    
    if (!token) {
      return null;
    }
    
    return await verifyTokenMiddleware(token);
  } catch (error) {
    return null;
  }
} 