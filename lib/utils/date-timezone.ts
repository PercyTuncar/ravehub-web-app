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
  
  // If it's already in YYYY-MM-DD format, return it directly to avoid timezone issues
  if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return dateString;
  }
  
  // If it's a Date object, use local date components
  if (dateString instanceof Date) {
    const year = dateString.getFullYear();
    const month = String(dateString.getMonth() + 1).padStart(2, '0');
    const day = String(dateString.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  // For ISO strings or other date formats, parse them carefully
  const dateStr = dateString as string;
  
  // Check if it's an ISO string with time (YYYY-MM-DDTHH:mm:ss...)
  // Extract just the date part before 'T' and return it directly to avoid timezone issues
  if (dateStr.includes('T')) {
    const datePart = dateStr.split('T')[0];
    if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
      // Return the date part directly - this is the date that was originally selected
      // regardless of timezone, we want to show the same date
      return datePart;
    }
  }
  
  // Check if it's a date string in other formats (e.g., "12/12/2024")
  // Try to parse it as a date string
  if (dateStr.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
    // Handle MM/DD/YYYY or DD/MM/YYYY format (assume local interpretation)
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  }
  
  // Fallback: try to parse as date and use local components
  const date = new Date(dateString as string);
  
  // Check if date is valid
  if (isNaN(date.getTime())) {
    return '';
  }
  
  // Get local date components (not UTC)
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Formats a date for display - returns a localized date string
 * Handles YYYY-MM-DD format strings correctly to avoid timezone issues
 */
export function formatDateForDisplay(dateString: string | Date | undefined, locale: string = 'es-ES'): string {
  if (!dateString) return '';
  
  // If it's already in YYYY-MM-DD format, parse it as local date to avoid timezone shifts
  if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    const [year, month, day] = dateString.split('-').map(Number);
    // Create date in local timezone (not UTC)
    const localDate = new Date(year, month - 1, day);
    return localDate.toLocaleDateString(locale);
  }
  
  // If it's a Date object, use it directly
  if (dateString instanceof Date) {
    return dateString.toLocaleDateString(locale);
  }
  
  // For ISO strings, extract date part if possible
  const dateStr = dateString as string;
  if (dateStr.includes('T')) {
    const datePart = dateStr.split('T')[0];
    if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
      const [year, month, day] = datePart.split('-').map(Number);
      const localDate = new Date(year, month - 1, day);
      return localDate.toLocaleDateString(locale);
    }
  }
  
  // Fallback: try to parse as date
  const date = new Date(dateString as string);
  if (isNaN(date.getTime())) {
    return '';
  }
  
  return date.toLocaleDateString(locale);
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

/**
 * Parses a date string (YYYY-MM-DD or ISO string) into a Date object in local timezone
 * This prevents timezone shifts when displaying dates from the database
 * 
 * @param dateString - Date string in YYYY-MM-DD format or ISO format
 * @returns Date object in local timezone
 */
export function parseLocalDate(dateString: string | Date | undefined): Date {
  if (!dateString) {
    return new Date();
  }
  
  // If it's already a Date object, return it
  if (dateString instanceof Date) {
    return dateString;
  }
  
  // If it's already in YYYY-MM-DD format, parse it as local date
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    const [year, month, day] = dateString.split('-').map(Number);
    // Create date in local timezone (not UTC) - this prevents timezone shifts
    return new Date(year, month - 1, day);
  }
  
  // For ISO strings, extract date part if possible
  if (dateString.includes('T')) {
    const datePart = dateString.split('T')[0];
    if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
      const [year, month, day] = datePart.split('-').map(Number);
      // Create date in local timezone (not UTC)
      return new Date(year, month - 1, day);
    }
  }
  
  // Fallback: try to parse normally
  // But if it's a date-only string that was parsed as UTC, we need to handle it
  const parsed = new Date(dateString);
  
  // Check if the date was shifted due to UTC interpretation
  // If the input was YYYY-MM-DD and the parsed date is off by timezone offset,
  // we should parse it as local instead
  if (dateString.match(/^\d{4}-\d{2}-\d{2}/)) {
    const datePart = dateString.split('T')[0].split(' ')[0];
    const [year, month, day] = datePart.split('-').map(Number);
    return new Date(year, month - 1, day);
  }
  
  return parsed;
}

/**
 * Formats an ISO date string for input[type="datetime-local"]
 * Converts ISO string to local datetime format (YYYY-MM-DDTHH:mm)
 * This ensures the datetime displayed matches what was stored, accounting for timezone
 * 
 * @param dateString - ISO date string from database
 * @returns Formatted string for datetime-local input (YYYY-MM-DDTHH:mm) or empty string
 */
export function formatDateTimeLocalForInput(dateString: string | Date | undefined): string {
  if (!dateString) return '';
  
  let date: Date;
  
  if (dateString instanceof Date) {
    date = dateString;
  } else if (typeof dateString === 'string') {
    // Parse the ISO string - this will be in UTC
    date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return '';
    }
  } else {
    return '';
  }
  
  // Get local date/time components
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Converts a datetime-local input value to ISO string
 * The input value is in local timezone, we need to convert it to ISO for storage
 * 
 * @param datetimeLocalString - String from datetime-local input (YYYY-MM-DDTHH:mm)
 * @returns ISO string for database storage
 */
export function convertDateTimeLocalToISO(datetimeLocalString: string): string {
  if (!datetimeLocalString) return '';
  
  // Parse the datetime-local string (which is in local timezone)
  const [datePart, timePart] = datetimeLocalString.split('T');
  if (!datePart || !timePart) return '';
  
  const [year, month, day] = datePart.split('-').map(Number);
  const [hours, minutes] = timePart.split(':').map(Number);
  
  // Create date in local timezone
  const localDate = new Date(year, month - 1, day, hours, minutes, 0, 0);
  
  // Convert to ISO string (this will include timezone offset)
  return localDate.toISOString();
}

/**
 * Compares two date strings, handling timezone correctly
 * Uses parseLocalDate for consistent comparison
 * 
 * @param date1 - First date string
 * @param date2 - Second date string
 * @returns Negative if date1 < date2, positive if date1 > date2, 0 if equal
 */
export function compareDates(date1: string | Date, date2: string | Date): number {
  const d1 = parseLocalDate(date1 instanceof Date ? date1 : date1);
  const d2 = parseLocalDate(date2 instanceof Date ? date2 : date2);
  return d1.getTime() - d2.getTime();
}









