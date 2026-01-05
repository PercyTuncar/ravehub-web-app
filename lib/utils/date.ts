
export const getValidDate = (date: any): Date | null => {
    if (!date) return null;
    if (date instanceof Date) return date;
    if (typeof date === 'string') return new Date(date);
    if (typeof date === 'object' && 'seconds' in date) {
        return new Date(date.seconds * 1000);
    }
    return null;
};
