
/**
 * Helper to ensure Firebase Storage URLs are readable by crawlers (Google, Facebook, etc.)
 * Firebase Storage URLs return JSON metadata by default unless ?alt=media is appended.
 */
export const getReadableFirebaseUrl = (url: string | undefined | null): string => {
    if (!url) return '';

    // If it's a Firebase Storage URL and DOES NOT have the alt=media parameter
    if (url.includes('firebasestorage.googleapis.com') && !url.includes('alt=media')) {
        // Check if it already has other parameters (use &) or is the first one (use ?)
        const separator = url.includes('?') ? '&' : '?';
        return `${url}${separator}alt=media`;
    }

    return url;
};
