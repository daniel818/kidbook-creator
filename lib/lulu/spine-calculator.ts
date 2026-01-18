// ============================================
// Spine Width Calculator for Lulu Books
// ============================================
// Calculates spine width based on page count and paper type

/**
 * Paper thickness in inches per page
 * Source: Lulu documentation and industry standards
 */
export const PAPER_THICKNESS = {
    /** Standard 60# uncoated paper */
    standard: 0.002252,
    /** Premium 80# coated paper */
    premium: 0.0025,
} as const;

export type PaperType = keyof typeof PAPER_THICKNESS;

/**
 * Calculate the spine width for a book
 * @param pageCount - Total number of pages (must include all interior pages)
 * @param paperType - Type of paper stock
 * @returns Spine width in inches
 */
export function calculateSpineWidth(pageCount: number, paperType: PaperType): number {
    if (pageCount <= 0) {
        throw new Error('Page count must be greater than 0');
    }

    const thickness = PAPER_THICKNESS[paperType];
    if (!thickness) {
        throw new Error(`Invalid paper type: ${paperType}`);
    }

    // Spine width = page count × paper thickness per page
    return pageCount * thickness;
}

/**
 * Get minimum spine width for different binding types
 */
export const MINIMUM_SPINE_WIDTH = {
    softcover: 0.04,  // 40 mil minimum for perfect binding
    hardcover: 0.25,  // Case-wrapped hardcover minimum
} as const;

/**
 * Check if a book has enough pages for the binding type
 */
export function canBind(pageCount: number, paperType: PaperType, bindingType: 'softcover' | 'hardcover'): boolean {
    const spineWidth = calculateSpineWidth(pageCount, paperType);
    return spineWidth >= MINIMUM_SPINE_WIDTH[bindingType];
}
