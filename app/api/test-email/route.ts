import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const { to, subject, message } = await request.json();

    if (!to || !subject || !message) {
      return NextResponse.json(
        { error: "Missing required fields: to, subject, message" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #10b981, #f59e0b); padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Proliink Connect</h1>
        </div>
        <div style="padding: 30px; background: white; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <h2 style="color: #374151; margin-bottom: 20px;">Test Email</h2>
          <p style="color: #6b7280; line-height: 1.6; margin-bottom: 25px;">
            This is a test email to verify your Resend integration is working correctly.
          </p>
          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 8px 0;"><strong>Subject:</strong> ${subject}</p>
            <p style="margin: 8px 0;"><strong>Message:</strong> ${message}</p>
            <p style="margin: 8px 0;"><strong>Sent at:</strong> ${new Date().toLocaleString()}</p>
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
    `;

    const result = await sendEmail({
      to,
      subject,
      html,
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: "Test email sent successfully",
        messageId: result.messageId,
        dev: result.dev,
      });
    } else {
      return NextResponse.json(
        { error: result.error || "Failed to send email" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Test email error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Test email endpoint",
    usage: "POST /api/test-email with { to, subject, message }",
    example: {
      to: "test@example.com",
      subject: "Test Email",
      message: "This is a test message",
    },
  });
}
