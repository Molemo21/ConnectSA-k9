"use client"

/**
 * Formats a date for display in the South African time zone
 * @param date The date to format (can be Date object or ISO string)
 * @param options Additional Intl.DateTimeFormatOptions
 * @returns Formatted date string
 */
export function formatSADate(date: Date | string, options: Intl.DateTimeFormatOptions = {}) {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  // South Africa uses SAST (UTC+2)
  const saDate = new Date(d.getTime() + (2 * 60 + d.getTimezoneOffset()) * 60000);
  
  return new Intl.DateTimeFormat('en-ZA', {
    timeZone: 'Africa/Johannesburg',
    ...options
  }).format(saDate);
}

/**
 * Formats a time for display in the South African time zone
 * @param date The date to format (can be Date object or ISO string)
 * @returns Formatted time string (HH:mm)
 */
export function formatSATime(date: Date | string) {
  return formatSADate(date, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}

/**
 * Formats a date and time for display in the South African time zone
 * @param date The date to format (can be Date object or ISO string)
 * @returns Formatted date and time string
 */
export function formatSADateTime(date: Date | string) {
  return formatSADate(date, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}

/**
 * Creates a Date object in the South African time zone
 * @param date The date string (YYYY-MM-DD)
 * @param time The time string (HH:mm)
 * @returns Date object
 */
export function createSADateTime(date: string, time: string): Date {
  const [hours, minutes] = time.split(':').map(Number);
  const d = new Date(date);
  
  // Set the time in the local time zone
  d.setHours(hours, minutes, 0, 0);
  
  // Convert to UTC while preserving the intended local time
  const tzOffset = d.getTimezoneOffset();
  return new Date(d.getTime() - tzOffset * 60000);
}
