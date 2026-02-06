/**
 * Text formatting utilities for story content
 */

/**
 * Splits story text into paragraphs based on sentence count.
 * - 1-3 sentences: keeps as 1 paragraph
 * - 4+ sentences: splits into chunks of 2-3 sentences each
 * 
 * @param text - The raw story text for a page
 * @returns Array of paragraph strings
 */
export function formatTextIntoParagraphs(text: string): string[] {
    if (!text?.trim()) return [];

    // Match sentences ending with . ! ? (including quoted endings)
    const sentenceRegex = /[^.!?]*[.!?]+["']?\s*/g;
    const sentences = text.match(sentenceRegex);

    // If no proper sentences found, return text as single paragraph
    if (!sentences || sentences.length === 0) {
        return [text.trim()];
    }

    // For 1-3 sentences, keep as single paragraph
    if (sentences.length <= 3) {
        return [text.trim()];
    }

    // For 4+ sentences, split into paragraphs of 2-3 sentences each
    const paragraphs: string[] = [];
    const maxPerParagraph = 3;

    for (let i = 0; i < sentences.length; i += maxPerParagraph) {
        const chunk = sentences.slice(i, i + maxPerParagraph).join('').trim();
        if (chunk) {
            paragraphs.push(chunk);
        }
    }

    return paragraphs;
}
