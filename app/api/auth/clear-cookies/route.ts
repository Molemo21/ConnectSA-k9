import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    const cookieStore = await cookies();
    
    // Clear all auth-related cookies
    cookieStore.delete('auth-token');
    cookieStore.delete('accessToken');
    cookieStore.delete('refresh-token');
    cookieStore.delete('user-session');
    
    return NextResponse.json({ 
      success: true, 
      message: 'All authentication cookies cleared' 
    });
  } catch (error) {
    console.error('Error clearing cookies:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to clear cookies' 
    }, { status: 500 });
  }
}