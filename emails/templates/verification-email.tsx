import React from 'react';

interface VerificationEmailProps {
  name: string;
  verificationLink: string;
}

export const VerificationEmailHTML = ({ name, verificationLink }: VerificationEmailProps) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your Email - Proliink Connect</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f8fafc;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #10b981, #f59e0b); padding: 32px 24px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">Proliink Connect</h1>
          <p style="color: rgba(255, 255, 255, 0.9); margin: 8px 0 0 0; font-size: 16px;">South Africa's Premier Service Marketplace</p>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 32px;">
          <h2 style="color: #1f2937; margin: 0 0 24px 0; font-size: 24px; font-weight: 600;">Welcome to Proliink Connect!</h2>
          
          <p style="color: #6b7280; line-height: 1.6; margin: 0 0 24px 0; font-size: 16px;">
            Hello ${name || 'there'},<br><br>
            Thank you for joining Proliink Connect! To complete your registration and start connecting with amazing service providers, please verify your email address.
          </p>
          
          <!-- CTA Button -->
          <div style="text-align: center; margin: 32px 0;">
            <a href="${verificationLink}" 
               style="background: linear-gradient(135deg, #10b981, #f59e0b); 
                      color: white; 
                      padding: 16px 32px; 
                      text-decoration: none; 
                      border-radius: 8px; 
                      font-weight: 600; 
                      font-size: 16px; 
                      display: inline-block;
                      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);">
              Verify Email Address
            </a>
          </div>
          
          <!-- Security Notice -->
          <div style="background: #f9fafb; padding: 24px; border-radius: 8px; margin: 32px 0; border-left: 4px solid #10b981;">
            <h3 style="color: #1f2937; margin: 0 0 12px 0; font-size: 16px; font-weight: 600;">🔒 Security Notice</h3>
            <p style="color: #6b7280; margin: 0; font-size: 14px; line-height: 1.5;">
              This verification link will expire in 1 hour for your security. If you didn't create an account with Proliink Connect, you can safely ignore this email.
            </p>
          </div>
          
          <!-- Alternative Link -->
          <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 14px; text-align: center; margin: 0;">
              If the button doesn't work, copy and paste this link into your browser:<br>
              <a href="${verificationLink}" style="color: #10b981; word-break: break-all;">${verificationLink}</a>
            </p>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="background: #f8fafc; padding: 24px 32px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0 0 8px 0;">
            © 2024 Proliink Connect. All rights reserved.
          </p>
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            Domain: app.proliinkconnect.co.za
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
};

export const VerificationEmailText = ({ name, verificationLink }: VerificationEmailProps) => {
  return `
Welcome to Proliink Connect!

Hello ${name || 'there'},

Thank you for joining Proliink Connect! To complete your registration and start connecting with amazing service providers, please verify your email address.

Click the link below to verify your email:
${verificationLink}

Security Notice:
- This verification link will expire in 1 hour for your security
- If you didn't create an account with Proliink Connect, you can safely ignore this email

If you have any questions, please contact our support team.

Best regards,
The Proliink Connect Team

---
© 2024 Proliink Connect. All rights reserved.
Domain: app.proliinkconnect.co.za
  `.trim();
};
