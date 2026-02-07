// ============================================
// Zod Validation Schemas
// ============================================
// Centralized validation schemas for all API routes.
// Replaces manual if/else validation with type-safe schemas.

import { z } from 'zod';

// ---- Common Fields ----

const childGenderSchema = z.enum(['boy', 'girl', 'other']).optional();

// ---- AI Generation Schemas ----

export const generateStorySchema = z.object({
    childName: z.string().min(1, 'Child name is required').max(50),
    childAge: z.number().int().min(0).max(18).optional().default(5),
    childGender: childGenderSchema,
    bookTheme: z.string().min(1, 'Book theme is required').max(200),
    bookType: z.string().max(100).optional().default('story'),
    pageCount: z.number().int().min(4).max(30).optional().default(10),
    characterDescription: z.string().max(500).optional(),
    storyDescription: z.string().max(1000).optional(),
});

export const generateImageSchema = z.object({
    bookId: z.string().uuid(),
    pageIndex: z.number().int().min(0),
    scenePrompt: z.string().min(1).max(1000),
    characterDescription: z.string().max(500).optional().default(''),
    artStyle: z.string().max(50).optional().default('storybook_classic'),
    quality: z.enum(['fast', 'quality']).optional().default('fast'),
    childPhoto: z.string().optional(),
    aspectRatio: z.enum(['1:1', '3:4']).optional().default('3:4'),
});

export const regenerateImageSchema = z.object({
    bookId: z.string().uuid(),
    pageId: z.string().uuid(),
    pageNumber: z.number().int().min(1),
    imagePrompt: z.string().min(1).max(1000),
    characterDescription: z.string().max(500).optional().default(''),
    artStyle: z.string().max(50).optional().default('storybook_classic'),
    quality: z.enum(['fast', 'quality']).optional().default('fast'),
    childPhoto: z.string().optional(),
    aspectRatio: z.enum(['1:1', '3:4']).optional().default('3:4'),
});

export const generateBookSchema = z.object({
    childName: z.string().min(1).max(50),
    childAge: z.number().int().min(0).max(18).optional().default(5),
    childGender: childGenderSchema,
    bookTheme: z.string().min(1).max(200),
    bookType: z.string().max(100).optional().default('story'),
    pageCount: z.number().int().min(4).max(30).optional().default(10),
    characterDescription: z.string().max(500).optional(),
    storyDescription: z.string().max(1000).optional(),
    artStyle: z.string().max(50).optional().default('storybook_classic'),
    imageQuality: z.enum(['fast', 'quality']).optional().default('fast'),
    childPhoto: z.string().optional(),
    aspectRatio: z.enum(['1:1', '3:4']).optional().default('3:4'),
    language: z.enum(['en', 'de', 'he']).optional().default('en'),
});

// ---- Book Schemas ----

export const createBookSchema = z.object({
    title: z.string().min(1).max(200),
    childName: z.string().min(1).max(50),
    childAge: z.number().int().min(0).max(18).optional(),
    childGender: childGenderSchema,
    bookTheme: z.string().max(200).optional(),
    bookType: z.string().max(100).optional(),
    artStyle: z.string().max(50).optional(),
    language: z.enum(['en', 'de', 'he']).optional(),
});

export const updateBookSchema = z.object({
    title: z.string().min(1).max(200).optional(),
    status: z.enum(['preview', 'draft', 'completed', 'ordered']).optional(),
    thumbnail_url: z.string().url().optional(),
});

// ---- Checkout Schemas ----

export const checkoutSchema = z.object({
    bookId: z.string().uuid(),
    format: z.enum(['softcover', 'hardcover']),
    size: z.string().min(1).max(20),
    quantity: z.number().int().min(1).max(100),
    shipping: z.object({
        fullName: z.string().min(1).max(100),
        addressLine1: z.string().min(1).max(200),
        addressLine2: z.string().max(200).optional(),
        city: z.string().min(1).max(100),
        state: z.string().max(100).optional(),
        postalCode: z.string().min(1).max(20),
        country: z.string().min(2).max(2),
        phone: z.string().max(20).optional(),
    }),
    shippingOption: z.string().optional(),
});

export const createPaymentIntentSchema = z.object({
    bookId: z.string().uuid(),
    format: z.enum(['softcover', 'hardcover']),
    size: z.string().min(1).max(20),
    quantity: z.number().int().min(1).max(100),
    total: z.number().int().min(1), // cents
    shipping: z.object({
        fullName: z.string().min(1).max(100),
        addressLine1: z.string().min(1).max(200),
        addressLine2: z.string().max(200).optional(),
        city: z.string().min(1).max(100),
        state: z.string().max(100).optional(),
        postalCode: z.string().min(1).max(20),
        country: z.string().min(2).max(2),
        phone: z.string().max(20).optional(),
    }),
    shippingOption: z.string().optional(),
});

// ---- Lulu Schemas ----

export const calculateCostSchema = z.object({
    format: z.enum(['softcover', 'hardcover']),
    size: z.enum(['7.5x7.5', '8x8', '8x10']),
    pageCount: z.number().int().min(4).max(200),
    quantity: z.number().int().min(1).max(100),
    countryCode: z.string().length(2).optional(),
    postalCode: z.string().max(20).optional(),
    stateCode: z.string().max(10).optional(),
    shippingOption: z.enum(['MAIL', 'PRIORITY_MAIL', 'GROUND', 'EXPEDITED', 'EXPRESS']).optional(),
    shipping: z.object({
        fullName: z.string().max(100).optional(),
        addressLine1: z.string().max(200).optional(),
        addressLine2: z.string().max(200).optional(),
        city: z.string().max(100).optional(),
        state: z.string().max(100).optional(),
        postalCode: z.string().max(20).optional(),
        country: z.string().length(2).optional(),
        phone: z.string().max(20).optional(),
    }).optional(),
});

export const shippingOptionsSchema = z.object({
    format: z.enum(['softcover', 'hardcover']),
    size: z.string().min(1).max(20),
    pageCount: z.number().int().min(4).max(200),
    quantity: z.number().int().min(1).max(100),
    shipping: z.object({
        fullName: z.string().min(1).max(100),
        addressLine1: z.string().min(1).max(200),
        addressLine2: z.string().max(200).optional(),
        city: z.string().min(1).max(100),
        state: z.string().max(100).optional(),
        postalCode: z.string().min(1).max(20),
        country: z.string().min(2).max(2),
        phone: z.string().max(20).optional(),
    }),
    currency: z.string().max(3).optional().default('USD'),
});

// ---- Helper: Parse and validate ----

/**
 * Parse and validate a request body against a Zod schema.
 * Returns { success, data, error } using a boolean discriminant for proper TS narrowing.
 */
export function parseBody<T extends z.ZodType>(
    schema: T,
    body: unknown
): { success: true; data: z.infer<T>; error: null } | { success: false; data: null; error: string } {
    const result = schema.safeParse(body);
    if (result.success) {
        return { success: true, data: result.data, error: null };
    }

    const messages = result.error.issues.map(
        (issue) => `${issue.path.join('.')}: ${issue.message}`
    );

    return { success: false, data: null, error: messages.join('; ') };
}
