/** Escapes HTML special characters to prevent XSS when rendering user/AI content */
export declare function escapeHtml(str: string): string;
/** Strips all HTML tags from a string */
export declare function stripTags(str: string): string;
/** Truncates a string to maxLength, appending '...' if truncated */
export declare function truncate(str: string, maxLength: number): string;
