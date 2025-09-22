import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { 

export const dynamic = 'force-dynamic'

  sendEmail, 
  sendVerificationEmail, 
  sendPasswordResetEmail, 
  sendBookingConfirmationEmail 
} from "@/lib/email";

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
      case "basic":
        result = await sendEmail({
          to: email,
          subject: "Test Email - Proliink Connect",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #10b981, #f59e0b); padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 24px;">Proliink Connect</h1>
              </div>
              <div style="padding: 30px; background: white; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <h2 style="color: #374151; margin-bottom: 20px;">Test Email</h2>
                <p style="color: #6b7280; line-height: 1.6; margin-bottom: 25px;">
                  This is a basic test email to verify your Resend integration is working correctly.
                </p>
                <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 8px 0;"><strong>Test Type:</strong> Basic Email</p>
                  <p style="margin: 8px 0;"><strong>Sent at:</strong> ${new Date().toLocaleString()}</p>
                  <p style="margin: 8px 0;"><strong>From:</strong> no-reply@app.proliinkconnect.co.za</p>
                </div>
                <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
                  If you received this email, your Resend integration is working perfectly! 🎉
                </p>
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 25px 0;">
                <p style="color: #9ca3af; font-size: 12px; text-align: center;">
                  Domain: app.proliinkconnect.co.za
                </p>
              </div>
            </div>
          `,
          text: `
Test Email - Proliink Connect

This is a basic test email to verify your Resend integration is working correctly.

Test Details:
- Test Type: Basic Email
- Sent at: ${new Date().toLocaleString()}
- From: no-reply@app.proliinkconnect.co.za

If you received this email, your Resend integration is working perfectly! 🎉

---
Domain: app.proliinkconnect.co.za
          `.trim()
        });
        break;

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
          { error: "Invalid test type. Valid types: basic, verification, password-reset, booking-confirmation" },
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
        timestamp: new Date().toISOString()
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
    console.error("Test email error:", error);
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
      message: "Email Testing API",
      availableTests: [
        {
          type: "basic",
          description: "Send a basic test email",
          requiredFields: ["email"]
        },
        {
          type: "verification",
          description: "Send an email verification email",
          requiredFields: ["email"]
        },
        {
          type: "password-reset",
          description: "Send a password reset email",
          requiredFields: ["email"]
        },
        {
          type: "booking-confirmation",
          description: "Send a booking confirmation email",
          requiredFields: ["email"]
        }
      ],
      usage: {
        method: "POST",
        endpoint: "/api/test-email-comprehensive",
        body: {
          testType: "basic|verification|password-reset|booking-confirmation",
          email: "recipient@example.com"
        }
      },
      examples: {
        basic: {
          testType: "basic",
          email: "test@example.com"
        },
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
      }
    });
  } catch (error) {
    console.error("Test email API info error:", error);
    return NextResponse.json({
      error: "Failed to get API information"
    }, { status: 500 });
  }
}
