// ============================================
// Text Formatting Tests
// ============================================

import { formatTextIntoParagraphs, normalizeParagraphText } from '@/lib/utils/text-formatting';

describe('formatTextIntoParagraphs', () => {
    describe('edge cases', () => {
        it('returns empty array for empty string', () => {
            expect(formatTextIntoParagraphs('')).toEqual([]);
        });

        it('returns empty array for whitespace-only string', () => {
            expect(formatTextIntoParagraphs('   ')).toEqual([]);
        });

        it('returns empty array for null/undefined', () => {
            expect(formatTextIntoParagraphs(null as unknown as string)).toEqual([]);
            expect(formatTextIntoParagraphs(undefined as unknown as string)).toEqual([]);
        });
    });

    describe('text without \\n\\n', () => {
        it('returns single paragraph for text without breaks', () => {
            const text = 'Once upon a time there was a brave little girl. She loved to explore.';
            expect(formatTextIntoParagraphs(text)).toEqual([text]);
        });

        it('returns single paragraph for single sentence', () => {
            const text = 'Hello world!';
            expect(formatTextIntoParagraphs(text)).toEqual(['Hello world!']);
        });

        it('returns single paragraph for many sentences without \\n\\n', () => {
            const text = 'One. Two. Three. Four. Five. Six.';
            expect(formatTextIntoParagraphs(text)).toEqual([text]);
        });
    });

    describe('text with \\n\\n breaks', () => {
        it('splits on double newlines', () => {
            const text = 'First paragraph.\n\nSecond paragraph.';
            expect(formatTextIntoParagraphs(text)).toEqual([
                'First paragraph.',
                'Second paragraph.'
            ]);
        });

        it('handles three paragraphs', () => {
            const text = 'Para one.\n\nPara two.\n\nPara three.';
            expect(formatTextIntoParagraphs(text)).toEqual([
                'Para one.',
                'Para two.',
                'Para three.'
            ]);
        });

        it('handles triple+ newlines same as double', () => {
            const text = 'First.\n\n\nSecond.\n\n\n\nThird.';
            expect(formatTextIntoParagraphs(text)).toEqual([
                'First.',
                'Second.',
                'Third.'
            ]);
        });

        it('filters out empty paragraphs from extra newlines', () => {
            const text = '\n\nFirst paragraph.\n\n\n\n';
            expect(formatTextIntoParagraphs(text)).toEqual(['First paragraph.']);
        });
    });

    describe('single \\n within paragraphs', () => {
        it('collapses single newlines to spaces', () => {
            const text = 'First line\nsecond line.\n\nNew paragraph.';
            expect(formatTextIntoParagraphs(text)).toEqual([
                'First line second line.',
                'New paragraph.'
            ]);
        });

        it('collapses single newlines in text without double breaks', () => {
            const text = 'Line one.\nLine two.\nLine three.';
            expect(formatTextIntoParagraphs(text)).toEqual([
                'Line one. Line two. Line three.'
            ]);
        });
    });

    describe('trimming', () => {
        it('trims whitespace from paragraphs', () => {
            const text = '  First paragraph.  \n\n  Second paragraph.  ';
            expect(formatTextIntoParagraphs(text)).toEqual([
                'First paragraph.',
                'Second paragraph.'
            ]);
        });
    });

    describe('realistic story content', () => {
        it('handles ages 9-12 multi-paragraph story text', () => {
            const text = 'Maya stared at the old treehouse, her heart pounding. The wooden ladder looked shakier than she remembered, but the secret map in her pocket felt warm and certain.\n\nShe took a deep breath — superhero breath, just like Mom taught her — and climbed. Each rung creaked, but held firm beneath her sneakers.\n\n"I can do this," she whispered, pulling herself onto the platform. The view from up here was worth every scary step.';
            const result = formatTextIntoParagraphs(text);
            expect(result).toHaveLength(3);
            expect(result[0]).toContain('Maya stared');
            expect(result[1]).toContain('superhero breath');
            expect(result[2]).toContain('I can do this');
        });

        it('handles Hebrew/RTL text with paragraph breaks', () => {
            const text = 'פעם היה ילד אמיץ בשם דני. הוא אהב לגלות דברים חדשים.\n\nיום אחד הוא מצא מפה ישנה בעליית הגג.';
            const result = formatTextIntoParagraphs(text);
            expect(result).toHaveLength(2);
            expect(result[0]).toContain('דני');
            expect(result[1]).toContain('מפה');
        });

        it('handles very long single paragraph without splitting', () => {
            const text = 'The brave little fox crept through the forest, sniffing at every mushroom and peeking behind every tree. She was searching for the golden acorn that the wise owl had told her about. The sun filtered through the canopy above, painting dappled shadows on the moss-covered ground. Birds chirped in the branches, cheering her on. A butterfly landed on her nose and she giggled.';
            const result = formatTextIntoParagraphs(text);
            expect(result).toHaveLength(1);
            expect(result[0]).toBe(text);
        });
    });

    describe('mixed whitespace', () => {
        it('handles tabs around paragraph breaks', () => {
            const text = 'First paragraph.\t\n\n\tSecond paragraph.';
            expect(formatTextIntoParagraphs(text)).toEqual([
                'First paragraph.',
                'Second paragraph.'
            ]);
        });

        it('handles text with only single newlines — returns single paragraph', () => {
            const text = 'Line one.\nLine two.\nLine three.\nLine four.';
            expect(formatTextIntoParagraphs(text)).toEqual([
                'Line one. Line two. Line three. Line four.'
            ]);
        });
    });
});

describe('normalizeParagraphText', () => {
    it('returns empty string for empty input', () => {
        expect(normalizeParagraphText('')).toBe('');
    });

    it('returns empty string for whitespace-only input', () => {
        expect(normalizeParagraphText('   ')).toBe('');
    });

    it('normalizes \\r\\n to \\n', () => {
        const text = 'First.\r\n\r\nSecond.';
        expect(normalizeParagraphText(text)).toBe('First.\n\nSecond.');
    });

    it('collapses 3+ newlines to 2', () => {
        const text = 'First.\n\n\n\nSecond.';
        expect(normalizeParagraphText(text)).toBe('First.\n\nSecond.');
    });

    it('trims leading and trailing whitespace', () => {
        const text = '  First.\n\nSecond.  ';
        expect(normalizeParagraphText(text)).toBe('First.\n\nSecond.');
    });

    it('preserves valid double newlines', () => {
        const text = 'One.\n\nTwo.\n\nThree.';
        expect(normalizeParagraphText(text)).toBe('One.\n\nTwo.\n\nThree.');
    });

    it('handles null/undefined', () => {
        expect(normalizeParagraphText(null as unknown as string)).toBe('');
        expect(normalizeParagraphText(undefined as unknown as string)).toBe('');
    });

    it('handles mixed \\r\\n and \\n in same text', () => {
        const text = 'First.\r\n\r\nSecond.\n\nThird.';
        expect(normalizeParagraphText(text)).toBe('First.\n\nSecond.\n\nThird.');
    });

    it('preserves single \\r\\n as single \\n', () => {
        const text = 'Line one.\r\nLine two.';
        expect(normalizeParagraphText(text)).toBe('Line one.\nLine two.');
    });
});

describe('roundtrip: normalize → format', () => {
    it('preserves paragraph structure through save → display cycle', () => {
        const original = 'First paragraph with some text.\n\nSecond paragraph here.\n\nThird and final paragraph.';
        const normalized = normalizeParagraphText(original);
        const paragraphs = formatTextIntoParagraphs(normalized);
        expect(paragraphs).toEqual([
            'First paragraph with some text.',
            'Second paragraph here.',
            'Third and final paragraph.'
        ]);
    });

    it('cleans up messy input and preserves intent', () => {
        const messy = '  First paragraph.  \r\n\r\n\r\n  Second paragraph.  \n\n\n\n\n  Third.  ';
        const normalized = normalizeParagraphText(messy);
        const paragraphs = formatTextIntoParagraphs(normalized);
        expect(paragraphs).toEqual([
            'First paragraph.',
            'Second paragraph.',
            'Third.'
        ]);
    });

    it('handles single paragraph roundtrip', () => {
        const original = 'Just one paragraph with no breaks at all.';
        const normalized = normalizeParagraphText(original);
        const paragraphs = formatTextIntoParagraphs(normalized);
        expect(paragraphs).toEqual(['Just one paragraph with no breaks at all.']);
    });
});
