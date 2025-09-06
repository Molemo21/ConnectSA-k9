import { Resend } from 'resend';
import { VerificationEmailHTML, VerificationEmailText } from '../emails/templates/verification-email';
import { PasswordResetEmailHTML, PasswordResetEmailText } from '../emails/templates/password-reset-email';
import { BookingConfirmationEmailHTML, BookingConfirmationEmailText } from '../emails/templates/booking-confirmation-email';

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
  text?: string;
  from?: string;
}

export interface EmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  dev?: boolean;
}

/**
 * Get the appropriate from email address based on environment
 */
const getFromEmail = () => {
  // Use verified domain in production, fallback to generic in development
  if (process.env.NODE_ENV === 'production') {
    return process.env.FROM_EMAIL || 'no-reply@app.proliinkconnect.co.za';
  }
  return 'no-reply@app.proliinkconnect.co.za';
};

/**
 * Send email using Resend in production, or log to console in development
 */
export async function sendEmail(data: EmailData): Promise<EmailResponse> {
  const { to, subject, html, text, from = getFromEmail() } = data;

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
    const emailData: any = {
      from,
      to,
      subject,
      html,
    };
    
    // Add text version if provided
    if (text) {
      emailData.text = text;
    }
    
    const result = await resend.emails.send(emailData);

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
  const subject = 'Password Reset Request - Proliink Connect';
  const html = PasswordResetEmailHTML({ name, resetLink });
  const text = PasswordResetEmailText({ name, resetLink });

  return sendEmail({ to, subject, html, text });
}

/**
 * Send email verification email
 */
export async function sendVerificationEmail(
  to: string, 
  name: string, 
  verificationLink: string
): Promise<EmailResponse> {
  const subject = 'Verify Your Email - Proliink Connect';
  const html = VerificationEmailHTML({ name, verificationLink });
  const text = VerificationEmailText({ name, verificationLink });

  return sendEmail({ to, subject, html, text });
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
    bookingId: string;
    totalAmount?: number;
  }
): Promise<EmailResponse> {
  const subject = 'Booking Confirmation - Proliink Connect';
  const html = BookingConfirmationEmailHTML({ name, bookingDetails });
  const text = BookingConfirmationEmailText({ name, bookingDetails });

  return sendEmail({ to, subject, html, text });
}
