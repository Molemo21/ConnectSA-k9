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
  // Use verified domain when available, fallback to generic default
  return process.env.FROM_EMAIL || 'no-reply@app.proliinkconnect.co.za';
};

/**
 * Send email via Resend when configured; otherwise log to console.
 */
export async function sendEmail(data: EmailData): Promise<EmailResponse> {
  const { to, subject, html, text, from = getFromEmail() } = data;

  // If Resend is configured, attempt to send (works in dev and prod)
  if (resend && process.env.RESEND_API_KEY) {
    try {
      const emailData: any = {
        from,
        to,
        subject,
        html,
      };
      if (text) emailData.text = text;

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
      // Fall through to dev logging so flows continue during issues
    }
  }

  // Fallback: log email to console (useful when no email provider configured)
  console.log('📧 EMAIL LOG (no provider configured or fallback):');
  console.log('To:', to);
  console.log('From:', from);
  console.log('Subject:', subject);
  console.log('HTML:', html);
  if (text) console.log('Text:', text);
  return { success: true, dev: true };
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
