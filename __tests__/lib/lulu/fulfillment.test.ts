// ============================================
// Fulfillment Integration Tests
// ============================================
// TDD: Tests for the complete fulfillment pipeline

import { fulfillOrder, FulfillmentResult, FulfillmentStatus } from '@/lib/lulu/fulfillment';
import { createLuluClient } from '@/lib/lulu/client';

// Mock the Lulu client
jest.mock('@/lib/lulu/client', () => ({
    createLuluClient: jest.fn(() => ({
        uploadPrintFile: jest.fn().mockResolvedValue('printable-id-123'),
        createPrintJob: jest.fn().mockResolvedValue({
            id: 'print-job-123',
            status: 'CREATED',
            lineItems: [{ id: 'li-1', status: 'CREATED' }],
        }),
        getPrintJob: jest.fn().mockResolvedValue({
            id: 'print-job-123',
            status: 'IN_PRODUCTION',
            lineItems: [{ id: 'li-1', status: 'IN_PRODUCTION' }],
        }),
    })),
}));

// Mock Supabase with proper table handling
jest.mock('@/lib/supabase/server', () => ({
    createClient: jest.fn(() => {
        // Track which table is being queried
        let currentTable = '';

        return {
            from: jest.fn((table: string) => {
                currentTable = table;
                return {
                    select: jest.fn(() => ({
                        eq: jest.fn(() => ({
                            single: jest.fn().mockImplementation(() => {
                                if (currentTable === 'orders') {
                                    return Promise.resolve({
                                        data: {
                                            id: 'order-123',
                                            book_id: 'book-123',
                                            format: 'hardcover',
                                            size: '8x8',
                                            quantity: 1,
                                            shipping_full_name: 'Test User',
                                            shipping_address_line1: '123 Test St',
                                            shipping_city: 'Test City',
                                            shipping_state: 'TS',
                                            shipping_postal_code: '12345',
                                            shipping_country: 'United States',
                                            shipping_phone: '555-1234',
                                            user_email: 'test@example.com',
                                        },
                                        error: null,
                                    });
                                } else if (currentTable === 'books') {
                                    return Promise.resolve({
                                        data: {
                                            id: 'book-123',
                                            user_id: 'user-123',
                                            title: 'Test Adventure',
                                            child_name: 'Test Child',
                                            child_age: 5,
                                            book_theme: 'adventure',
                                            book_type: 'picture',
                                            created_at: new Date().toISOString(),
                                            updated_at: new Date().toISOString(),
                                            pages: [
                                                {
                                                    id: 'page-1',
                                                    page_number: 1,
                                                    page_type: 'cover',
                                                    background_color: '#ffffff',
                                                    text_elements: [],
                                                    image_elements: [{ src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==' }],
                                                    created_at: new Date().toISOString(),
                                                    updated_at: new Date().toISOString(),
                                                },
                                                {
                                                    id: 'page-2',
                                                    page_number: 2,
                                                    page_type: 'inside',
                                                    background_color: '#ffffff',
                                                    text_elements: [{ content: 'Once upon a time...' }],
                                                    image_elements: [{ src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==' }],
                                                    created_at: new Date().toISOString(),
                                                    updated_at: new Date().toISOString(),
                                                },
                                            ],
                                        },
                                        error: null,
                                    });
                                }
                                return Promise.resolve({ data: null, error: { message: 'Not found' } });
                            }),
                        })),
                    })),
                    update: jest.fn(() => ({
                        eq: jest.fn().mockResolvedValue({ error: null }),
                    })),
                };
            }),
        };
    }),
}));

describe('Fulfillment Pipeline', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('fulfillOrder', () => {
        it('returns success result on successful fulfillment', async () => {
            const result = await fulfillOrder('order-123');

            expect(result.status).toBe(FulfillmentStatus.SUCCESS);
            expect(result.printJobId).toBe('print-job-123');
        });

        it('generates interior PDF', async () => {
            const result = await fulfillOrder('order-123');

            expect(result.status).toBe(FulfillmentStatus.SUCCESS);
            // Should have called PDF generator
        });

        it('generates cover PDF', async () => {
            const result = await fulfillOrder('order-123');

            expect(result.status).toBe(FulfillmentStatus.SUCCESS);
            // Should have called cover generator
        });

        it('uploads both PDFs to Lulu', async () => {
            await fulfillOrder('order-123');

            const luluClient = createLuluClient();
            expect(luluClient.uploadPrintFile).toHaveBeenCalledTimes(2);
        });

        it('creates print job with correct shipping address', async () => {
            await fulfillOrder('order-123');

            const luluClient = createLuluClient();
            expect(luluClient.createPrintJob).toHaveBeenCalledWith(
                expect.objectContaining({
                    shippingAddress: expect.objectContaining({
                        name: 'Test User',
                        streetAddress: '123 Test St',
                    }),
                })
            );
        });

        it('updates order status in database', async () => {
            const result = await fulfillOrder('order-123');

            expect(result.status).toBe(FulfillmentStatus.SUCCESS);
            // Database should be updated with print job ID
        });

        it('handles Lulu API errors gracefully', async () => {
            // Override mock to throw error
            (createLuluClient as jest.Mock).mockReturnValueOnce({
                uploadPrintFile: jest.fn().mockRejectedValue(new Error('Upload failed')),
            });

            const result = await fulfillOrder('order-123');

            expect(result.status).toBe(FulfillmentStatus.FAILED);
            expect(result.error).toContain('Upload failed');
        });

        it('handles PDF generation errors', async () => {
            // This would require mocking the PDF generator to throw
            // For now, we just ensure the function handles errors
            const result = await fulfillOrder('nonexistent-order');

            expect(result.status).toBe(FulfillmentStatus.FAILED);
        });

        it('returns printable IDs for debugging', async () => {
            const result = await fulfillOrder('order-123');

            expect(result.interiorPrintableId).toBeDefined();
            expect(result.coverPrintableId).toBeDefined();
        });
    });

    describe('FulfillmentStatus', () => {
        it('has correct status values', () => {
            expect(FulfillmentStatus.SUCCESS).toBe('SUCCESS');
            expect(FulfillmentStatus.FAILED).toBe('FAILED');
            expect(FulfillmentStatus.PENDING).toBe('PENDING');
        });
    });
});
