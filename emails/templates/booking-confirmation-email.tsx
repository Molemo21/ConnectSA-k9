import React from 'react';

interface BookingConfirmationEmailProps {
  name: string;
  bookingDetails: {
    serviceName: string;
    providerName: string;
    date: string;
    time: string;
    location: string;
    bookingId: string;
    totalAmount?: number;
  };
}

export const BookingConfirmationEmailHTML = ({ name, bookingDetails }: BookingConfirmationEmailProps) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Booking Confirmation - Proliink Connect</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f8fafc;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #10b981, #f59e0b); padding: 32px 24px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">Proliink Connect</h1>
          <p style="color: rgba(255, 255, 255, 0.9); margin: 8px 0 0 0; font-size: 16px;">Booking Confirmed!</p>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 32px;">
          <h2 style="color: #1f2937; margin: 0 0 24px 0; font-size: 24px; font-weight: 600;">Your Booking is Confirmed! 🎉</h2>
          
          <p style="color: #6b7280; line-height: 1.6; margin: 0 0 32px 0; font-size: 16px;">
            Hello ${name},<br><br>
            Great news! Your booking has been confirmed. Here are all the details:
          </p>
          
          <!-- Booking Details Card -->
          <div style="background: #f9fafb; padding: 24px; border-radius: 12px; margin: 24px 0; border: 1px solid #e5e7eb;">
            <h3 style="color: #1f2937; margin: 0 0 20px 0; font-size: 18px; font-weight: 600;">📋 Booking Details</h3>
            
            <div style="margin-bottom: 16px;">
              <span style="color: #6b7280; font-weight: 600; display: inline-block; width: 120px;">Service:</span>
              <span style="color: #1f2937; font-weight: 500;">${bookingDetails.serviceName}</span>
            </div>
            
            <div style="margin-bottom: 16px;">
              <span style="color: #6b7280; font-weight: 600; display: inline-block; width: 120px;">Provider:</span>
              <span style="color: #1f2937; font-weight: 500;">${bookingDetails.providerName}</span>
            </div>
            
            <div style="margin-bottom: 16px;">
              <span style="color: #6b7280; font-weight: 600; display: inline-block; width: 120px;">Date:</span>
              <span style="color: #1f2937; font-weight: 500;">${bookingDetails.date}</span>
            </div>
            
            <div style="margin-bottom: 16px;">
              <span style="color: #6b7280; font-weight: 600; display: inline-block; width: 120px;">Time:</span>
              <span style="color: #1f2937; font-weight: 500;">${bookingDetails.time}</span>
            </div>
            
            <div style="margin-bottom: 16px;">
              <span style="color: #6b7280; font-weight: 600; display: inline-block; width: 120px;">Location:</span>
              <span style="color: #1f2937; font-weight: 500;">${bookingDetails.location}</span>
            </div>
            
            <div style="margin-bottom: 16px;">
              <span style="color: #6b7280; font-weight: 600; display: inline-block; width: 120px;">Booking ID:</span>
              <span style="color: #1f2937; font-weight: 500; font-family: monospace;">${bookingDetails.bookingId}</span>
            </div>
            
            ${bookingDetails.totalAmount ? `
            <div style="margin-bottom: 0; padding-top: 16px; border-top: 1px solid #e5e7eb;">
              <span style="color: #6b7280; font-weight: 600; display: inline-block; width: 120px;">Total:</span>
              <span style="color: #10b981; font-weight: 600; font-size: 18px;">R${bookingDetails.totalAmount.toFixed(2)}</span>
            </div>
            ` : ''}
          </div>
          
          <!-- Next Steps -->
          <div style="background: #ecfdf5; padding: 24px; border-radius: 8px; margin: 32px 0; border-left: 4px solid #10b981;">
            <h3 style="color: #065f46; margin: 0 0 12px 0; font-size: 16px; font-weight: 600;">📅 What's Next?</h3>
            <ul style="color: #065f46; margin: 0; font-size: 14px; line-height: 1.5; padding-left: 20px;">
              <li>You'll receive a reminder 24 hours before your appointment</li>
              <li>Your service provider will contact you if needed</li>
              <li>You can manage your booking in your dashboard</li>
            </ul>
          </div>
          
          <!-- Support Info -->
          <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0;">
              Need to make changes to your booking? Contact your service provider directly or reach out to our support team.
            </p>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="background: #f8fafc; padding: 24px 32px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0 0 8px 0;">
            © 2024 Proliink Connect. All rights reserved.
          </p>
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            Thank you for choosing Proliink Connect!
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
};

export const BookingConfirmationEmailText = ({ name, bookingDetails }: BookingConfirmationEmailProps) => {
  return `
Booking Confirmation - Proliink Connect

Hello ${name},

Great news! Your booking has been confirmed. Here are all the details:

BOOKING DETAILS:
Service: ${bookingDetails.serviceName}
Provider: ${bookingDetails.providerName}
Date: ${bookingDetails.date}
Time: ${bookingDetails.time}
Location: ${bookingDetails.location}
Booking ID: ${bookingDetails.bookingId}
${bookingDetails.totalAmount ? `Total: R${bookingDetails.totalAmount.toFixed(2)}` : ''}

WHAT'S NEXT?
- You'll receive a reminder 24 hours before your appointment
- Your service provider will contact you if needed
- You can manage your booking in your dashboard

Need to make changes to your booking? Contact your service provider directly or reach out to our support team.

Thank you for choosing Proliink Connect!

---
© 2024 Proliink Connect. All rights reserved.
Domain: app.proliinkconnect.co.za
  `.trim();
};
