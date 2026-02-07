// ============================================
// Zod Validation Schema Tests
// ============================================

import {
    generateStorySchema,
    generateImageSchema,
    regenerateImageSchema,
    generateBookSchema,
    createBookSchema,
    updateBookSchema,
    checkoutSchema,
    createPaymentIntentSchema,
    calculateCostSchema,
    shippingOptionsSchema,
    parseBody,
} from '@/lib/validations';

// ---- parseBody helper ----

describe('parseBody', () => {
    const schema = generateStorySchema;

    it('returns success with valid data', () => {
        const result = parseBody(schema, { childName: 'Emma', bookTheme: 'adventure' });
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.childName).toBe('Emma');
            expect(result.data.bookTheme).toBe('adventure');
            expect(result.error).toBeNull();
        }
    });

    it('applies defaults for optional fields', () => {
        const result = parseBody(schema, { childName: 'Emma', bookTheme: 'adventure' });
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.childAge).toBe(5);
            expect(result.data.bookType).toBe('story');
            expect(result.data.pageCount).toBe(10);
        }
    });

    it('returns error with formatted message on failure', () => {
        const result = parseBody(schema, { childName: '', bookTheme: '' });
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.data).toBeNull();
            expect(typeof result.error).toBe('string');
            expect(result.error.length).toBeGreaterThan(0);
        }
    });

    it('returns error for completely invalid input', () => {
        const result = parseBody(schema, null);
        expect(result.success).toBe(false);
    });

    it('returns error for missing required fields', () => {
        const result = parseBody(schema, {});
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error).toContain('childName');
            expect(result.error).toContain('bookTheme');
        }
    });
});

// ---- generateStorySchema ----

describe('generateStorySchema', () => {
    const validData = {
        childName: 'Emma',
        bookTheme: 'adventure',
    };

    it('accepts minimal valid input', () => {
        const result = generateStorySchema.safeParse(validData);
        expect(result.success).toBe(true);
    });

    it('accepts full valid input', () => {
        const result = generateStorySchema.safeParse({
            ...validData,
            childAge: 7,
            childGender: 'girl',
            bookType: 'picture',
            pageCount: 12,
            characterDescription: 'A brave girl with curly hair',
            storyDescription: 'An adventure in the forest',
        });
        expect(result.success).toBe(true);
    });

    it('rejects empty childName', () => {
        const result = generateStorySchema.safeParse({ ...validData, childName: '' });
        expect(result.success).toBe(false);
    });

    it('rejects childName over 50 chars', () => {
        const result = generateStorySchema.safeParse({ ...validData, childName: 'x'.repeat(51) });
        expect(result.success).toBe(false);
    });

    it('rejects invalid childAge', () => {
        expect(generateStorySchema.safeParse({ ...validData, childAge: -1 }).success).toBe(false);
        expect(generateStorySchema.safeParse({ ...validData, childAge: 19 }).success).toBe(false);
        expect(generateStorySchema.safeParse({ ...validData, childAge: 1.5 }).success).toBe(false);
    });

    it('accepts valid childAge boundaries', () => {
        expect(generateStorySchema.safeParse({ ...validData, childAge: 0 }).success).toBe(true);
        expect(generateStorySchema.safeParse({ ...validData, childAge: 18 }).success).toBe(true);
    });

    it('rejects invalid childGender', () => {
        const result = generateStorySchema.safeParse({ ...validData, childGender: 'invalid' });
        expect(result.success).toBe(false);
    });

    it('rejects pageCount out of range', () => {
        expect(generateStorySchema.safeParse({ ...validData, pageCount: 3 }).success).toBe(false);
        expect(generateStorySchema.safeParse({ ...validData, pageCount: 31 }).success).toBe(false);
    });
});

// ---- generateBookSchema ----

describe('generateBookSchema', () => {
    const validData = {
        childName: 'Max',
        bookTheme: 'space adventure',
    };

    it('accepts minimal valid input with defaults', () => {
        const result = generateBookSchema.safeParse(validData);
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.artStyle).toBe('storybook_classic');
            expect(result.data.imageQuality).toBe('fast');
            expect(result.data.language).toBe('en');
        }
    });

    it('accepts all art styles', () => {
        const styles = ['storybook_classic', 'watercolor', 'digital_art', 'cartoon', 'pixel_art', 'coloring_book'];
        for (const style of styles) {
            const result = generateBookSchema.safeParse({ ...validData, artStyle: style });
            expect(result.success).toBe(true);
        }
    });

    it('rejects invalid art style', () => {
        const result = generateBookSchema.safeParse({ ...validData, artStyle: 'invalid_style' });
        expect(result.success).toBe(false);
    });

    it('accepts preview mode fields', () => {
        const result = generateBookSchema.safeParse({
            ...validData,
            preview: true,
            previewPageCount: 3,
        });
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.preview).toBe(true);
            expect(result.data.previewPageCount).toBe(3);
        }
    });

    it('accepts valid language codes', () => {
        for (const lang of ['en', 'de', 'he']) {
            expect(generateBookSchema.safeParse({ ...validData, language: lang }).success).toBe(true);
        }
    });

    it('rejects invalid language code', () => {
        expect(generateBookSchema.safeParse({ ...validData, language: 'fr' }).success).toBe(false);
    });
});

// ---- regenerateImageSchema ----

describe('regenerateImageSchema', () => {
    const validData = {
        bookId: '550e8400-e29b-41d4-a716-446655440000',
        pageNumber: 1,
        prompt: 'A magical forest scene',
    };

    it('accepts minimal valid input', () => {
        expect(regenerateImageSchema.safeParse(validData).success).toBe(true);
    });

    it('accepts full valid input', () => {
        const result = regenerateImageSchema.safeParse({
            ...validData,
            currentImageContext: 'watercolor',
            style: 'A cute child character',
            quality: 'pro',
        });
        expect(result.success).toBe(true);
    });

    it('rejects non-UUID bookId', () => {
        expect(regenerateImageSchema.safeParse({ ...validData, bookId: 'abc-123' }).success).toBe(false);
    });

    it('rejects missing bookId', () => {
        const { bookId: _, ...rest } = validData;
        expect(regenerateImageSchema.safeParse(rest).success).toBe(false);
    });

    it('rejects missing prompt', () => {
        const { prompt: _, ...rest } = validData;
        expect(regenerateImageSchema.safeParse(rest).success).toBe(false);
    });

    it('rejects pageNumber of 0', () => {
        expect(regenerateImageSchema.safeParse({ ...validData, pageNumber: 0 }).success).toBe(false);
    });
});

// ---- createBookSchema ----

describe('createBookSchema', () => {
    const validData = {
        settings: {
            title: 'My Adventure Book',
            childName: 'Emma',
        },
    };

    it('accepts minimal valid input', () => {
        expect(createBookSchema.safeParse(validData).success).toBe(true);
    });

    it('rejects missing settings wrapper', () => {
        expect(createBookSchema.safeParse({ title: 'Test', childName: 'Emma' }).success).toBe(false);
    });

    it('rejects empty title', () => {
        expect(createBookSchema.safeParse({ settings: { ...validData.settings, title: '' } }).success).toBe(false);
    });

    it('rejects empty childName', () => {
        expect(createBookSchema.safeParse({ settings: { ...validData.settings, childName: '' } }).success).toBe(false);
    });
});

// ---- updateBookSchema ----

describe('updateBookSchema', () => {
    it('accepts empty body (all fields optional)', () => {
        expect(updateBookSchema.safeParse({}).success).toBe(true);
    });

    it('accepts settings update', () => {
        expect(updateBookSchema.safeParse({
            settings: { title: 'New Title' },
        }).success).toBe(true);
    });

    it('accepts status update', () => {
        expect(updateBookSchema.safeParse({ status: 'completed' }).success).toBe(true);
    });

    it('rejects invalid status', () => {
        expect(updateBookSchema.safeParse({ status: 'invalid' }).success).toBe(false);
    });

    it('accepts pageEdits', () => {
        expect(updateBookSchema.safeParse({
            pageEdits: [{ pageId: 'page-1', text: 'Updated text' }],
        }).success).toBe(true);
    });

    it('rejects pageEdit missing pageId', () => {
        expect(updateBookSchema.safeParse({
            pageEdits: [{ text: 'Updated text' }],
        }).success).toBe(false);
    });
});

// ---- checkoutSchema ----

describe('checkoutSchema', () => {
    const validData = {
        bookId: '550e8400-e29b-41d4-a716-446655440000',
        format: 'softcover' as const,
        size: '8x10' as const,
        quantity: 1,
        shipping: {
            fullName: 'John Doe',
            addressLine1: '123 Main St',
            city: 'New York',
            postalCode: '10001',
            country: 'US',
        },
        shippingLevel: 'MAIL' as const,
        pdfUrl: '/path/to/interior.pdf',
        coverUrl: '/path/to/cover.pdf',
    };

    it('accepts valid checkout data', () => {
        expect(checkoutSchema.safeParse(validData).success).toBe(true);
    });

    it('rejects invalid bookId format', () => {
        expect(checkoutSchema.safeParse({ ...validData, bookId: 'not-a-uuid' }).success).toBe(false);
    });

    it('rejects invalid format', () => {
        expect(checkoutSchema.safeParse({ ...validData, format: 'paperback' }).success).toBe(false);
    });

    it('rejects invalid size', () => {
        expect(checkoutSchema.safeParse({ ...validData, size: '5x5' }).success).toBe(false);
    });

    it('rejects quantity of 0', () => {
        expect(checkoutSchema.safeParse({ ...validData, quantity: 0 }).success).toBe(false);
    });

    it('rejects missing pdfUrl', () => {
        const { pdfUrl: _, ...rest } = validData;
        expect(checkoutSchema.safeParse(rest).success).toBe(false);
    });

    it('rejects missing coverUrl', () => {
        const { coverUrl: _, ...rest } = validData;
        expect(checkoutSchema.safeParse(rest).success).toBe(false);
    });

    it('rejects country code not 2 chars', () => {
        expect(checkoutSchema.safeParse({
            ...validData,
            shipping: { ...validData.shipping, country: 'USA' },
        }).success).toBe(false);
    });
});

// ---- createPaymentIntentSchema ----

describe('createPaymentIntentSchema', () => {
    const validData = {
        bookId: '550e8400-e29b-41d4-a716-446655440000',
        format: 'hardcover' as const,
        size: '8x8' as const,
        quantity: 2,
        shipping: {
            fullName: 'Jane Doe',
            addressLine1: '456 Oak Ave',
            city: 'LA',
            postalCode: '90001',
            country: 'US',
        },
        shippingLevel: 'EXPEDITED' as const,
    };

    it('accepts valid payment intent data', () => {
        expect(createPaymentIntentSchema.safeParse(validData).success).toBe(true);
    });

    it('accepts all valid shipping levels', () => {
        for (const level of ['MAIL', 'PRIORITY_MAIL', 'GROUND_HD', 'GROUND', 'EXPEDITED', 'EXPRESS']) {
            expect(createPaymentIntentSchema.safeParse({ ...validData, shippingLevel: level }).success).toBe(true);
        }
    });

    it('rejects invalid shipping level', () => {
        expect(createPaymentIntentSchema.safeParse({ ...validData, shippingLevel: 'INVALID' }).success).toBe(false);
    });

    it('rejects invalid size', () => {
        expect(createPaymentIntentSchema.safeParse({ ...validData, size: '6x6' }).success).toBe(false);
    });
});

// ---- calculateCostSchema ----

describe('calculateCostSchema', () => {
    const validData = {
        format: 'softcover' as const,
        size: '7.5x7.5' as const,
        pageCount: 20,
        quantity: 1,
    };

    it('accepts minimal valid input', () => {
        expect(calculateCostSchema.safeParse(validData).success).toBe(true);
    });

    it('accepts all valid sizes', () => {
        for (const size of ['7.5x7.5', '8x8', '8x10']) {
            expect(calculateCostSchema.safeParse({ ...validData, size }).success).toBe(true);
        }
    });

    it('rejects invalid size', () => {
        expect(calculateCostSchema.safeParse({ ...validData, size: '10x10' }).success).toBe(false);
    });

    it('rejects pageCount below 4', () => {
        expect(calculateCostSchema.safeParse({ ...validData, pageCount: 3 }).success).toBe(false);
    });

    it('rejects pageCount above 200', () => {
        expect(calculateCostSchema.safeParse({ ...validData, pageCount: 201 }).success).toBe(false);
    });

    it('accepts optional shipping fields', () => {
        const result = calculateCostSchema.safeParse({
            ...validData,
            countryCode: 'US',
            postalCode: '10001',
            shippingOption: 'GROUND',
        });
        expect(result.success).toBe(true);
    });

    it('rejects invalid shippingOption', () => {
        expect(calculateCostSchema.safeParse({ ...validData, shippingOption: 'INVALID' }).success).toBe(false);
    });
});

// ---- shippingOptionsSchema ----

describe('shippingOptionsSchema', () => {
    const validData = {
        format: 'softcover' as const,
        size: '8x10' as const,
        pageCount: 20,
        quantity: 1,
        shipping: {
            fullName: 'John Doe',
            addressLine1: '123 Main St',
            city: 'New York',
            postalCode: '10001',
            country: 'US',
        },
    };

    it('accepts valid input with default currency', () => {
        const result = shippingOptionsSchema.safeParse(validData);
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.currency).toBe('USD');
        }
    });

    it('accepts custom currency', () => {
        const result = shippingOptionsSchema.safeParse({ ...validData, currency: 'EUR' });
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.currency).toBe('EUR');
        }
    });

    it('rejects missing shipping object', () => {
        const { shipping: _, ...rest } = validData;
        expect(shippingOptionsSchema.safeParse(rest).success).toBe(false);
    });

    it('rejects invalid format', () => {
        expect(shippingOptionsSchema.safeParse({ ...validData, format: 'spiral' }).success).toBe(false);
    });
});
