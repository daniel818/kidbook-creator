/**
 * Text formatting utilities for story content
 */

/**
 * Splits story text into paragraphs using explicit \n\n breaks.
 * If no explicit breaks exist, returns text as a single paragraph.
 *
 * Single \n within a paragraph block is collapsed to a space
 * (common when text wraps in textareas or JSON strings).
 *
 * @param text - The raw story text for a page
 * @returns Array of paragraph strings
 */
export function formatTextIntoParagraphs(text: string): string[] {
    if (!text?.trim()) return [];

    // Split on double newlines (2+)
    const parts = text.split(/\n\n+/);
    const paragraphs = parts
        .map(p => p.replace(/\n/g, ' ').trim()) // Collapse single \n to space
        .filter(p => p.length > 0);

    return paragraphs.length > 0 ? paragraphs : [text.trim()];
}

/**
 * Normalizes text while preserving paragraph breaks.
 * Useful when saving edited text to ensure clean storage.
 *
 * @param text - Raw edited text (may come from contentEditable or textarea)
 * @returns Normalized text with clean \n\n paragraph breaks
 */
export function normalizeParagraphText(text: string): string {
    if (!text?.trim()) return '';
    return text
        .replace(/\r\n/g, '\n')       // Normalize line endings
        .replace(/\n{3,}/g, '\n\n')   // Collapse 3+ newlines to 2
        .trim();
}
