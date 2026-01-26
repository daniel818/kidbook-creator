import { Book } from '@/lib/types';

export type PrintFormat = 'softcover' | 'hardcover';
export type PrintSize = '7.5x7.5' | '8x8' | '8x10';

export function getInteriorPageCount(book: Book): number {
    const insidePages = book.pages?.filter((page) => page.type === 'inside').length || 0;
    return insidePages * 2;
}

export function getPrintableInteriorPageCount(
    book: Book,
    format: PrintFormat,
    size: PrintSize
): number {
    const baseCount = getInteriorPageCount(book);
    const minCount = format === 'hardcover' ? 32 : (size === '8x8' ? 24 : 32);
    const paddedCount = Math.max(baseCount, minCount);
    return paddedCount % 2 === 0 ? paddedCount : paddedCount + 1;
}
