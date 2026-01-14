// ============================================
// Input Validation Tests
// ============================================

describe('Input Validation', () => {
    describe('Book Settings Validation', () => {
        const validateBookSettings = (settings: Record<string, unknown>) => {
            const errors: string[] = [];

            if (settings.title && typeof settings.title !== 'string') {
                errors.push('Invalid title');
            }

            if (settings.childAge !== undefined) {
                if (typeof settings.childAge !== 'number' || settings.childAge < 0 || settings.childAge > 18) {
                    errors.push('Invalid child age');
                }
            }

            if (settings.childName && typeof settings.childName !== 'string') {
                errors.push('Invalid child name');
            }

            const validBookTypes = ['board', 'picture', 'story', 'alphabet'];
            if (settings.bookType && !validBookTypes.includes(settings.bookType as string)) {
                errors.push('Invalid book type');
            }

            const validThemes = ['adventure', 'bedtime', 'learning', 'fantasy', 'animals', 'custom'];
            if (settings.bookTheme && !validThemes.includes(settings.bookTheme as string)) {
                errors.push('Invalid book theme');
            }

            return errors;
        };

        it('should accept valid settings', () => {
            const settings = {
                title: 'My Adventure Book',
                childName: 'Emma',
                childAge: 5,
                bookType: 'picture',
                bookTheme: 'adventure',
            };

            expect(validateBookSettings(settings)).toEqual([]);
        });

        it('should reject invalid title type', () => {
            const settings = { title: 123 };
            expect(validateBookSettings(settings)).toContain('Invalid title');
        });

        it('should reject negative age', () => {
            const settings = { childAge: -1 };
            expect(validateBookSettings(settings)).toContain('Invalid child age');
        });

        it('should reject age over 18', () => {
            const settings = { childAge: 19 };
            expect(validateBookSettings(settings)).toContain('Invalid child age');
        });

        it('should accept age of 0', () => {
            const settings = { childAge: 0 };
            expect(validateBookSettings(settings)).toEqual([]);
        });

        it('should accept age of 18', () => {
            const settings = { childAge: 18 };
            expect(validateBookSettings(settings)).toEqual([]);
        });

        it('should reject invalid book type', () => {
            const settings = { bookType: 'invalid' };
            expect(validateBookSettings(settings)).toContain('Invalid book type');
        });

        it('should reject invalid theme', () => {
            const settings = { bookTheme: 'invalid' };
            expect(validateBookSettings(settings)).toContain('Invalid book theme');
        });
    });

    describe('Shipping Address Validation', () => {
        const validateShipping = (shipping: Record<string, unknown>) => {
            const required = ['fullName', 'addressLine1', 'city', 'state', 'postalCode', 'country', 'phone'];
            const missing = required.filter(field => !shipping[field]);
            return missing;
        };

        it('should accept complete shipping address', () => {
            const shipping = {
                fullName: 'John Doe',
                addressLine1: '123 Main St',
                city: 'New York',
                state: 'NY',
                postalCode: '10001',
                country: 'US',
                phone: '555-123-4567',
            };

            expect(validateShipping(shipping)).toEqual([]);
        });

        it('should identify missing required fields', () => {
            const shipping = {
                fullName: 'John Doe',
                addressLine1: '123 Main St',
            };

            const missing = validateShipping(shipping);
            expect(missing).toContain('city');
            expect(missing).toContain('state');
            expect(missing).toContain('postalCode');
        });
    });
});
