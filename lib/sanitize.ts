// ============================================
// Input Sanitization for AI Prompts
// ============================================
// Prevents prompt injection attacks by sanitizing user inputs
// before they are interpolated into AI prompts.

/**
 * Maximum allowed lengths for user inputs.
 * Prevents excessively long inputs from inflating token costs.
 */
const MAX_LENGTHS: Record<string, number> = {
    childName: 50,
    bookTheme: 200,
    bookType: 100,
    characterDescription: 500,
    storyDescription: 1000,
};

/**
 * Patterns that indicate prompt injection attempts.
 * These are common prompt injection prefixes/patterns.
 * NOTE: Uses global flag for sanitizeInput (replace all occurrences).
 * detectInjection must reset lastIndex before each .test() call.
 */
const INJECTION_PATTERNS = [
    /ignore\s+(all\s+)?(previous|above|prior)\s+(instructions|prompts|rules)/gi,
    /disregard\s+(all\s+)?(previous|above|prior)/gi,
    /you\s+are\s+now\s+/gi,
    /new\s+instructions?:/gi,
    /system\s*:\s*/gi,
    /\bact\s+as\b/gi,
    /\bpretend\s+(to\s+be|you\s+are)\b/gi,
    /\bdo\s+not\s+follow\b/gi,
    /\boverride\b.*\binstructions?\b/gi,
    /\bforget\s+(everything|all)\b/gi,
    /```[\s\S]*?(system|assistant|user)\s*:/gi,
    /\[INST\]/gi,
    /<<SYS>>/gi,
];

/**
 * Sanitize a single string input for safe use in AI prompts.
 *
 * - Trims whitespace
 * - Removes control characters
 * - Enforces max length
 * - Strips prompt injection patterns
 * - Escapes special delimiters
 */
export function sanitizeInput(input: unknown, fieldName?: string): string {
    if (typeof input !== 'string') return '';

    let sanitized = input.trim();

    // Remove control characters (keep newlines and tabs for descriptions)
    sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

    // Enforce max length
    const maxLen = (fieldName && MAX_LENGTHS[fieldName]) || 1000;
    if (sanitized.length > maxLen) {
        sanitized = sanitized.slice(0, maxLen);
    }

    // Neutralize all occurrences of injection patterns (global flag handles repeats)
    for (const pattern of INJECTION_PATTERNS) {
        pattern.lastIndex = 0;
        sanitized = sanitized.replace(pattern, '');
    }

    // Escape backticks and common prompt delimiters
    sanitized = sanitized
        .replace(/```/g, '')
        .replace(/<<</g, '')
        .replace(/>>>/g, '');

    return sanitized.trim();
}

/**
 * Sanitize all string fields in a story generation input object.
 * Returns a new object with sanitized values.
 */
export function sanitizeStoryInput<T extends Record<string, unknown>>(input: T): T {
    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(input)) {
        if (typeof value === 'string') {
            sanitized[key] = sanitizeInput(value, key);
        } else {
            sanitized[key] = value;
        }
    }

    return sanitized as T;
}

/**
 * Check if input contains suspicious patterns without modifying it.
 * Useful for logging/monitoring purposes.
 */
export function detectInjection(input: string): { isSuspicious: boolean; matchedPatterns: string[] } {
    const matchedPatterns: string[] = [];

    for (const pattern of INJECTION_PATTERNS) {
        // Reset lastIndex to avoid stateful regex bug with global flag
        pattern.lastIndex = 0;
        if (pattern.test(input)) {
            matchedPatterns.push(pattern.source);
        }
    }

    return {
        isSuspicious: matchedPatterns.length > 0,
        matchedPatterns,
    };
}
