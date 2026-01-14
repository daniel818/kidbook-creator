import '@testing-library/jest-dom';

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
process.env.STRIPE_SECRET_KEY = 'sk_test_xxx';
process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = 'pk_test_xxx';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_xxx';
process.env.RESEND_API_KEY = 're_test_xxx';
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
