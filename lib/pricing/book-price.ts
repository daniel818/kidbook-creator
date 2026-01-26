export type BookFormat = 'softcover' | 'hardcover';
export type BookSize = '7.5x7.5' | '8x8' | '8x10';

const DEFAULT_MARKUP = 1.0;

function getMarkupMultiplier(): number {
    const raw = process.env.NEXT_PUBLIC_BOOK_PRICE_MARKUP;
    if (!raw) return DEFAULT_MARKUP;
    const parsed = Number.parseFloat(raw);
    if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_MARKUP;
    return parsed;
}

export const PROFIT_MARGIN = getMarkupMultiplier();

export const BOOK_PRICE_MATRIX: Record<BookFormat, Record<BookSize, { basePrice: number; perPage: number }>> = {
    softcover: {
        '7.5x7.5': { basePrice: 899, perPage: 35 },
        '8x8': { basePrice: 1299, perPage: 45 },
        '8x10': { basePrice: 1499, perPage: 55 },
    },
    hardcover: {
        '7.5x7.5': { basePrice: 1899, perPage: 45 },
        '8x8': { basePrice: 2499, perPage: 55 },
        '8x10': { basePrice: 2999, perPage: 65 },
    },
};

export function calculateBookWholesale(
    format: BookFormat,
    size: BookSize,
    pageCount: number,
    quantity: number
): number {
    const pricing = BOOK_PRICE_MATRIX[format]?.[size];
    if (!pricing) {
        throw new Error('Invalid format/size');
    }
    return (pricing.basePrice + (pricing.perPage * pageCount)) * quantity;
}

export function calculateBookSubtotal(
    format: BookFormat,
    size: BookSize,
    pageCount: number,
    quantity: number
): number {
    return Math.round(calculateBookWholesale(format, size, pageCount, quantity) * PROFIT_MARGIN);
}
