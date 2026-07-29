
export const getValidDate = (date: any): Date | null => {
    if (!date) return null;
    if (date instanceof Date) return date;
    if (typeof date === 'string') return new Date(date);
    if (typeof date === 'object' && 'seconds' in date) {
        return new Date(date.seconds * 1000);
    }
    return null;
};

/**
 * Parse a date-only string ("YYYY-MM-DD", e.g. from an <input type="date">) as
 * LOCAL midnight instead of UTC midnight.
 *
 * `new Date("2026-01-15")` is interpreted as 2026-01-15T00:00:00Z (UTC). In a
 * negative-offset timezone (e.g. Peru/Chile UTC-5) this becomes 2026-01-14 in
 * local time, shifting installment due dates one day earlier. Building the Date
 * from explicit components anchors it to local midnight and avoids that shift.
 */
export const parseLocalDate = (dateStr: string): Date => {
    // Only special-case the plain date format; anything else falls back to Date().
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr?.trim() ?? '');
    if (match) {
        const [, year, month, day] = match;
        return new Date(Number(year), Number(month) - 1, Number(day));
    }
    return new Date(dateStr);
};
