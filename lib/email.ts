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

      console.log(`📤 Attempting to send email to: ${to}`);
      console.log(`📤 From: ${from}`);
      console.log(`📤 Subject: ${subject}`);
      
      const result = await resend.emails.send(emailData);

      if (result.error) {
        console.error('❌ Email sending failed via Resend API:', result.error);
        console.error('❌ Error details:', JSON.stringify(result.error, null, 2));
        console.error('❌ Recipient:', to);
        console.error('❌ Subject:', subject);
        return {
          success: false,
          error: result.error.message || 'Failed to send email via Resend'
        };
      }

      console.log('✅ Email sent successfully via Resend');
      console.log('✅ Message ID:', result.data?.id);
      console.log('✅ Recipient:', to);
      return {
        success: true,
        messageId: result.data?.id
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Email sending exception:', errorMessage);
      console.error('❌ Full error:', error);
      console.error('❌ Recipient:', to);
      console.error('❌ Subject:', subject);
      
      // Return error instead of falling through
      return {
        success: false,
        error: `Email service exception: ${errorMessage}`
      };
    }
  }

  // No email service configured - only allowed in development
  if (process.env.NODE_ENV === 'development') {
    console.log('⚠️ EMAIL PROVIDER NOT CONFIGURED - Development Mode');
    console.log('📧 EMAIL LOG (no provider configured):');
    console.log('To:', to);
    console.log('From:', from);
    console.log('Subject:', subject);
    console.log('HTML Preview:', html.substring(0, 200) + '...');
    if (text) console.log('Text Preview:', text.substring(0, 200) + '...');
    return { success: true, dev: true };
  }

  // Production environment without email service configured - critical error
  console.error('🚨 CRITICAL: Email service not configured in production!');
  console.error('🚨 Attempted to send to:', to);
  console.error('🚨 Subject:', subject);
  return {
    success: false,
    error: 'Email service not configured'
  };
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
 * Send email with retry logic
 */
async function sendEmailWithRetry(data: EmailData, maxRetries = 3): Promise<EmailResponse> {
  let lastError: EmailResponse | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`📧 Email send attempt ${attempt}/${maxRetries} to ${data.to}`);
    
    const result = await sendEmail(data);
    
    if (result.success) {
      if (attempt > 1) {
        console.log(`✅ Email sent successfully on attempt ${attempt}/${maxRetries}`);
      }
      return result;
    }
    
    lastError = result;
    console.error(`❌ Email send attempt ${attempt}/${maxRetries} failed:`, result.error);
    
    // Don't retry on certain errors (invalid email, authentication issues)
    if (result.error?.includes('authentication') || 
        result.error?.includes('invalid') || 
        result.error?.includes('not configured')) {
      console.error(`⛔ Non-retryable error detected, stopping retry attempts`);
      break;
    }
    
    // Wait before retrying (exponential backoff)
    if (attempt < maxRetries) {
      const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // Max 5 seconds
      console.log(`⏳ Waiting ${waitTime}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  
  console.error(`❌ All ${maxRetries} email send attempts failed for ${data.to}`);
  return lastError || { success: false, error: 'All retry attempts failed' };
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

  // Use retry logic for verification emails (critical)
  return sendEmailWithRetry({ to, subject, html, text }, 3);
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
