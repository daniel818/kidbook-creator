import { Book } from '@/lib/types';

export type PrintFormat = 'softcover' | 'hardcover';
export type PrintSize = '6x6' | '8x8' | '8x10';

export function getInteriorPageCount(book: Book): number {
    const insidePages = book.pages?.filter((page) => page.type === 'inside').length || 0;
    return insidePages * 2;
}

export function getPrintableInteriorPageCount(
    book: Book,
    _format: PrintFormat,
    _size: PrintSize
): number {
    const baseCount = getInteriorPageCount(book);
    const minCount = 24;
    const paddedCount = Math.max(baseCount, minCount);
    return paddedCount % 2 === 0 ? paddedCount : paddedCount + 1;
}
