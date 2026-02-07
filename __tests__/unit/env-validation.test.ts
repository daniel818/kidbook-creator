describe('Environment Variable Validation', () => {
    const originalEnv = process.env;

    // All required env vars with valid values
    const validEnv: Record<string, string> = {
        NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
        SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
        STRIPE_SECRET_KEY: 'sk_test_xxx',
        STRIPE_WEBHOOK_SECRET: 'whsec_xxx',
        GEMINI_API_KEY: 'test-gemini-key',
        LULU_API_KEY: 'test-lulu-key',
        LULU_API_SECRET: 'test-lulu-secret',
        RESEND_API_KEY: 'test-resend-key',
        NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
    };

    beforeEach(() => {
        jest.resetModules();
        process.env = { ...originalEnv };
    });

    afterAll(() => {
        process.env = originalEnv;
    });

    describe('Server env schema', () => {
        it('should pass with all required vars set', async () => {
            Object.assign(process.env, validEnv);

            const { getServerEnv } = await import('@/lib/env/server');
            expect(() => getServerEnv()).not.toThrow();
        });

        it('should throw when required vars are missing', async () => {
            // Set only some vars, omitting STRIPE_SECRET_KEY and GEMINI_API_KEY
            const partial = { ...validEnv };
            delete partial.STRIPE_SECRET_KEY;
            delete partial.GEMINI_API_KEY;
            Object.assign(process.env, partial);
            // Clear the vars to ensure they're truly missing
            delete process.env.STRIPE_SECRET_KEY;
            delete process.env.GEMINI_API_KEY;

            const { getServerEnv } = await import('@/lib/env/server');
            expect(() => getServerEnv()).toThrow(/Missing or invalid/);
        });

        it('should list all missing vars in error message', async () => {
            // Delete required vars that should trigger errors
            delete process.env.SUPABASE_SERVICE_ROLE_KEY;
            delete process.env.STRIPE_SECRET_KEY;
            delete process.env.GEMINI_API_KEY;
            delete process.env.LULU_API_KEY;
            delete process.env.LULU_API_SECRET;
            delete process.env.RESEND_API_KEY;
            delete process.env.STRIPE_WEBHOOK_SECRET;

            const { getServerEnv } = await import('@/lib/env/server');
            let errorMessage = '';
            try {
                getServerEnv();
            } catch (e: any) {
                errorMessage = e.message;
            }
            expect(errorMessage).toContain('SUPABASE_SERVICE_ROLE_KEY');
            expect(errorMessage).toContain('STRIPE_SECRET_KEY');
            expect(errorMessage).toContain('GEMINI_API_KEY');
        });

        it('should apply defaults for optional vars', async () => {
            Object.assign(process.env, validEnv);

            const { getServerEnv } = await import('@/lib/env/server');
            const env = getServerEnv();
            expect(env.GEMINI_TEXT_MODEL).toBe('gemini-3-flash-preview');
            expect(env.GEMINI_IMAGE_MODEL).toBe('gemini-3-pro-image-preview');
            expect(env.GEMINI_REF_IMAGE_MODEL).toBe('gemini-3-pro-image-preview');
            expect(env.LULU_SANDBOX).toBe('true');
            expect(env.EMAIL_FROM).toBe('KidBook Creator <orders@kidbookcreator.com>');
            expect(env.SUPABASE_STORAGE_ORIGIN).toBe('http://127.0.0.1:54321');
        });

        it('should accept overridden optional vars', async () => {
            Object.assign(process.env, validEnv);
            process.env.GEMINI_TEXT_MODEL = 'custom-model';
            process.env.LULU_SANDBOX = 'false';

            const { getServerEnv } = await import('@/lib/env/server');
            const env = getServerEnv();
            expect(env.GEMINI_TEXT_MODEL).toBe('custom-model');
            expect(env.LULU_SANDBOX).toBe('false');
        });

        it('should reject invalid STRIPE_SECRET_KEY format', async () => {
            Object.assign(process.env, validEnv);
            process.env.STRIPE_SECRET_KEY = 'not-a-stripe-key';

            const { getServerEnv } = await import('@/lib/env/server');
            expect(() => getServerEnv()).toThrow();
        });

        it('should reject invalid STRIPE_WEBHOOK_SECRET format', async () => {
            Object.assign(process.env, validEnv);
            process.env.STRIPE_WEBHOOK_SECRET = 'invalid';

            const { getServerEnv } = await import('@/lib/env/server');
            expect(() => getServerEnv()).toThrow();
        });

        it('should reject invalid URL for NEXT_PUBLIC_SUPABASE_URL', async () => {
            Object.assign(process.env, validEnv);
            process.env.NEXT_PUBLIC_SUPABASE_URL = 'not-a-url';

            const { getServerEnv } = await import('@/lib/env/server');
            expect(() => getServerEnv()).toThrow();
        });

        it('should allow optional vars to be undefined', async () => {
            Object.assign(process.env, validEnv);
            delete process.env.LULU_WEBHOOK_SECRET;
            delete process.env.INTERNAL_API_KEY;
            delete process.env.INTERNAL_API_BASE_URL;

            const { getServerEnv } = await import('@/lib/env/server');
            const env = getServerEnv();
            expect(env.LULU_WEBHOOK_SECRET).toBeUndefined();
            expect(env.INTERNAL_API_KEY).toBeUndefined();
            expect(env.INTERNAL_API_BASE_URL).toBeUndefined();
        });

        it('should cache result after first parse', async () => {
            Object.assign(process.env, validEnv);

            const { getServerEnv } = await import('@/lib/env/server');
            const first = getServerEnv();
            const second = getServerEnv();
            expect(first).toBe(second);
        });
    });

    describe('Client env validation', () => {
        it('should pass with all required client vars', async () => {
            process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';
            process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = 'pk_test_xxx';
            process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';

            const { validateClientEnv } = await import('@/lib/env/client');
            expect(() => validateClientEnv()).not.toThrow();
        });

        it('should throw when client vars are missing', async () => {
            delete process.env.NEXT_PUBLIC_SUPABASE_URL;
            delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

            const { validateClientEnv } = await import('@/lib/env/client');
            expect(() => validateClientEnv()).toThrow(/Missing required client/);
        });

        it('should list all missing client vars', async () => {
            delete process.env.NEXT_PUBLIC_SUPABASE_URL;
            delete process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

            const { validateClientEnv } = await import('@/lib/env/client');
            let errorMessage = '';
            try {
                validateClientEnv();
            } catch (e: any) {
                errorMessage = e.message;
            }
            expect(errorMessage).toContain('NEXT_PUBLIC_SUPABASE_URL');
            expect(errorMessage).toContain('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY');
        });
    });
});
