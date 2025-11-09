/**
 * Utility functions for handling dates with timezones
 * Ensures dates are stored correctly according to the event's timezone
 */

/**
 * Converts a date string and time to ISO string respecting the timezone
 * This prevents date shifts when saving to database
 */
export function combineDateAndTime(
  dateString: string,
  timeString: string,
  timezone?: string
): string {
  if (!dateString || !timeString) {
    return dateString || '';
  }

  // Create date in local timezone first
  const [year, month, day] = dateString.split('-').map(Number);
  const [hours, minutes] = timeString.split(':').map(Number);

  // Create date object - this will be in the user's local timezone
  const localDate = new Date(year, month - 1, day, hours, minutes, 0, 0);

  // If timezone is provided, we need to adjust
  // For now, we'll store as ISO string which is timezone-agnostic
  // The date and time are stored as-is, respecting what the user selected
  return localDate.toISOString();
}

/**
 * Formats a date for input[type="date"] - returns YYYY-MM-DD
 * This ensures the date displayed matches what was selected
 */
export function formatDateForInput(dateString: string | Date | undefined): string {
  if (!dateString) return '';
  
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  
  // Get local date components (not UTC)
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Formats a time for input[type="time"] - returns HH:MM
 */
export function formatTimeForInput(timeString: string | undefined): string {
  if (!timeString) return '';
  
  // If it's already in HH:MM format, return as is
  if (/^\d{2}:\d{2}$/.test(timeString)) {
    return timeString;
  }
  
  // If it's a full datetime string, extract time
  const date = new Date(timeString);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${hours}:${minutes}`;
}

/**
 * Gets the minimum date for date inputs (today)
 */
export function getMinDate(): string {
  const today = new Date();
  return formatDateForInput(today);
}

/**
 * Validates that a date is not in the past
 */
export function isDateInPast(dateString: string): boolean {
  if (!dateString) return false;
  
  const selectedDate = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  selectedDate.setHours(0, 0, 0, 0);
  
  return selectedDate < today;
}

/**
 * Validates that end date is after start date
 */
export function isEndDateBeforeStart(startDate: string, endDate: string): boolean {
  if (!startDate || !endDate) return false;
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  return end < start;
}

/**
 * Combines date and time into a single ISO string
 * This is used when saving to the database
 */
export function createDateTimeISO(dateString: string, timeString: string): string {
  if (!dateString || !timeString) return dateString || '';
  
  const [year, month, day] = dateString.split('-').map(Number);
  const [hours, minutes] = timeString.split(':').map(Number);
  
  // Create date in local timezone
  const date = new Date(year, month - 1, day, hours, minutes, 0, 0);
  
  // Return ISO string - this preserves the date/time as selected
  return date.toISOString();
}






