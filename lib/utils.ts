import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import crypto from 'crypto'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  // DEV MODE: Log email to console instead of sending
  console.log('DEV EMAIL LOG:');
  console.log('To:', to);
  console.log('Subject:', subject);
  console.log('HTML:', html);
  return { success: true, dev: true };
}

export function generateSecureToken(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}
