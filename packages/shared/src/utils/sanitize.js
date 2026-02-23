"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.escapeHtml = escapeHtml;
exports.stripTags = stripTags;
exports.truncate = truncate;
const HTML_ESCAPE_MAP = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
};
/** Escapes HTML special characters to prevent XSS when rendering user/AI content */
function escapeHtml(str) {
    return str.replace(/[&<>"']/g, (c) => HTML_ESCAPE_MAP[c] ?? c);
}
/** Strips all HTML tags from a string */
function stripTags(str) {
    return str.replace(/<[^>]*>/g, '');
}
/** Truncates a string to maxLength, appending '...' if truncated */
function truncate(str, maxLength) {
    if (str.length <= maxLength)
        return str;
    return str.slice(0, maxLength) + '...';
}
