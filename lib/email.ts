import { Resend } from 'resend';

// Initialize Resend client conditionally
const createResendClient = () => {
  if (!process.env.RESEND_API_KEY) {
    return null;
  }
  return new Resend(process.env.RESEND_API_KEY);
};

const resend = createResendClient();

export interface EmailData {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export interface EmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  dev?: boolean;
}

/**
 * Send email using Resend in production, or log to console in development
 */
export async function sendEmail(data: EmailData): Promise<EmailResponse> {
  const { to, subject, html, from = 'noreply@servicehubsa.com' } = data;

  // Development mode: log email to console
  if (process.env.NODE_ENV === 'development') {
    console.log('📧 DEV EMAIL LOG:');
    console.log('To:', to);
    console.log('From:', from);
    console.log('Subject:', subject);
    console.log('HTML:', html);
    return { success: true, dev: true };
  }

  // Production mode: send via Resend
  if (!resend || !process.env.RESEND_API_KEY) {
    console.error('❌ RESEND_API_KEY is not configured or Resend client not available');
    return { 
      success: false, 
      error: 'Email service not configured' 
    };
  }

  try {
    const result = await resend.emails.send({
      from,
      to,
      subject,
      html,
    });

    if (result.error) {
      console.error('❌ Email sending failed:', result.error);
      return { 
        success: false, 
        error: result.error.message || 'Failed to send email' 
      };
    }

    console.log('✅ Email sent successfully:', result.data?.id);
    return { 
      success: true, 
      messageId: result.data?.id 
    };

  } catch (error) {
    console.error('❌ Email sending error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  to: string, 
  name: string, 
  resetLink: string
): Promise<EmailResponse> {
  const subject = 'Password Reset Request - ServiceHub SA';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #10b981, #f59e0b); padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">ServiceHub SA</h1>
      </div>
      <div style="padding: 30px; background: white; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <h2 style="color: #374151; margin-bottom: 20px;">Password Reset Request</h2>
        <p style="color: #6b7280; line-height: 1.6; margin-bottom: 25px;">
          Hello ${name || 'there'},<br><br>
          We received a request to reset your password. Click the button below to create a new password:
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="background: linear-gradient(135deg, #10b981, #f59e0b); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
          If you didn't request this password reset, you can safely ignore this email.<br>
          This link will expire in 1 hour for security reasons.
        </p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 25px 0;">
        <p style="color: #9ca3af; font-size: 12px; text-align: center;">
          If the button doesn't work, copy and paste this link into your browser:<br>
          <a href="${resetLink}" style="color: #10b981;">${resetLink}</a>
        </p>
      </div>
    </div>
  `;

  return sendEmail({ to, subject, html });
}

/**
 * Send email verification email
 */
export async function sendVerificationEmail(
  to: string, 
  name: string, 
  verificationLink: string
): Promise<EmailResponse> {
  const subject = 'Verify Your Email - ServiceHub SA';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #10b981, #f59e0b); padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">ServiceHub SA</h1>
      </div>
      <div style="padding: 30px; background: white; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <h2 style="color: #374151; margin-bottom: 20px;">Verify Your Email Address</h2>
        <p style="color: #6b7280; line-height: 1.6; margin-bottom: 25px;">
          Hello ${name || 'there'},<br><br>
          Welcome to ServiceHub SA! Please verify your email address by clicking the button below:
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationLink}" style="background: linear-gradient(135deg, #10b981, #f59e0b); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
            Verify Email
          </a>
        </div>
        <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
          If you didn't create an account with ServiceHub SA, you can safely ignore this email.
        </p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 25px 0;">
        <p style="color: #9ca3af; font-size: 12px; text-align: center;">
          If the button doesn't work, copy and paste this link into your browser:<br>
          <a href="${verificationLink}" style="color: #10b981;">${verificationLink}</a>
        </p>
      </div>
    </div>
  `;

  return sendEmail({ to, subject, html });
}

/**
 * Send booking confirmation email
 */
export async function sendBookingConfirmationEmail(
  to: string,
  name: string,
  bookingDetails: {
    serviceName: string;
    providerName: string;
    date: string;
    time: string;
    location: string;
  }
): Promise<EmailResponse> {
  const subject = 'Booking Confirmation - ServiceHub SA';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #10b981, #f59e0b); padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">ServiceHub SA</h1>
      </div>
      <div style="padding: 30px; background: white; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <h2 style="color: #374151; margin-bottom: 20px;">Booking Confirmed!</h2>
        <p style="color: #6b7280; line-height: 1.6; margin-bottom: 25px;">
          Hello ${name},<br><br>
          Your booking has been confirmed! Here are the details:
        </p>
        <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 8px 0;"><strong>Service:</strong> ${bookingDetails.serviceName}</p>
          <p style="margin: 8px 0;"><strong>Provider:</strong> ${bookingDetails.providerName}</p>
          <p style="margin: 8px 0;"><strong>Date:</strong> ${bookingDetails.date}</p>
          <p style="margin: 8px 0;"><strong>Time:</strong> ${bookingDetails.time}</p>
          <p style="margin: 8px 0;"><strong>Location:</strong> ${bookingDetails.location}</p>
        </div>
        <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
          We'll send you a reminder before your appointment. If you need to make changes, please contact your service provider.
        </p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 25px 0;">
        <p style="color: #9ca3af; font-size: 12px; text-align: center;">
          Thank you for choosing ServiceHub SA!
        </p>
      </div>
    </div>
  `;

  return sendEmail({ to, subject, html });
}
