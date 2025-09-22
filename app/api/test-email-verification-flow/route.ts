import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { 
  sendVerificationEmail, 
  sendPasswordResetEmail, 
  sendBookingConfirmationEmail 
} from "@/lib/email";

// Force dynamic rendering to prevent build-time static generation
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { testType, email } = await request.json();

    if (!testType || !email) {
      return NextResponse.json(
        { error: "Missing required fields: testType, email" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    const baseUrl = request.nextUrl.origin || "http://localhost:3000";
    let result;

    switch (testType) {
      case "verification":
        const verificationToken = "test-verification-token-" + Date.now();
        const verificationLink = `${baseUrl}/verify-email?token=${verificationToken}`;
        result = await sendVerificationEmail(
          email,
          user.name || "Test User",
          verificationLink
        );
        break;

      case "password-reset":
        const resetToken = "test-reset-token-" + Date.now();
        const resetLink = `${baseUrl}/reset-password?token=${resetToken}`;
        result = await sendPasswordResetEmail(
          email,
          user.name || "Test User",
          resetLink
        );
        break;

      case "booking-confirmation":
        result = await sendBookingConfirmationEmail(
          email,
          user.name || "Test User",
          {
            serviceName: "Test Service",
            providerName: "Test Provider",
            date: new Date().toLocaleDateString('en-ZA', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            }),
            time: new Date().toLocaleTimeString('en-ZA', { 
              hour: '2-digit', 
              minute: '2-digit' 
            }),
            location: "123 Test Street, Cape Town, South Africa",
            bookingId: "TEST-" + Date.now(),
            totalAmount: 250.00
          }
        );
        break;

      default:
        return NextResponse.json(
          { error: "Invalid test type. Valid types: verification, password-reset, booking-confirmation" },
          { status: 400 }
        );
    }

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `${testType} email sent successfully`,
        testType,
        recipient: email,
        messageId: result.messageId,
        dev: result.dev,
        timestamp: new Date().toISOString(),
        domain: "app.proliinkconnect.co.za"
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error || "Failed to send email",
        testType,
        recipient: email,
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }

  } catch (error) {
    console.error("Email verification flow test error:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({
      message: "Email Verification Flow Testing API",
      description: "Test the complete email verification flow with Resend integration",
      domain: "app.proliinkconnect.co.za",
      availableTests: [
        {
          type: "verification",
          description: "Test email verification flow",
          requiredFields: ["email"],
          flow: [
            "1. User signs up",
            "2. Verification email sent via Resend",
            "3. User clicks verification link",
            "4. Email marked as verified in database",
            "5. User redirected to appropriate dashboard"
          ]
        },
        {
          type: "password-reset",
          description: "Test password reset flow",
          requiredFields: ["email"],
          flow: [
            "1. User requests password reset",
            "2. Reset email sent via Resend",
            "3. User clicks reset link",
            "4. User sets new password"
          ]
        },
        {
          type: "booking-confirmation",
          description: "Test booking confirmation flow",
          requiredFields: ["email"],
          flow: [
            "1. User books a service",
            "2. Provider accepts booking",
            "3. Confirmation email sent via Resend",
            "4. User receives booking details"
          ]
        }
      ],
      usage: {
        method: "POST",
        endpoint: "/api/test-email-verification-flow",
        body: {
          testType: "verification|password-reset|booking-confirmation",
          email: "recipient@example.com"
        }
      },
      examples: {
        verification: {
          testType: "verification",
          email: "test@example.com"
        },
        passwordReset: {
          testType: "password-reset",
          email: "test@example.com"
        },
        bookingConfirmation: {
          testType: "booking-confirmation",
          email: "test@example.com"
        }
      },
      integrationStatus: {
        resend: "✅ Integrated",
        domain: "✅ app.proliinkconnect.co.za verified",
        templates: "✅ HTML + Text fallbacks",
        security: "✅ Rate limiting, token expiration",
        database: "✅ Secure token storage",
        frontend: "✅ Mobile-first verification UI"
      }
    });
  } catch (error) {
    console.error("Email verification flow API info error:", error);
    return NextResponse.json({
      error: "Failed to get API information"
    }, { status: 500 });
  }
}
