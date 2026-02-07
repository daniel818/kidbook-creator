// ============================================
// Supabase Browser Client
// ============================================
// Use this client in Client Components only.
// During SSR/build, env vars may be absent — we return a throwing proxy
// so no accidental network requests or silent failures can occur.

import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

export function createClient(): SupabaseClient {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
        // During SSR/build, return a no-op proxy stub.
        // Property access (e.g. supabase.auth for useEffect deps) returns a
        // nested stub, but calling any method throws immediately.
        // This is safe because actual Supabase calls only happen inside
        // useEffect / event handlers, which don't execute during SSR.
        const buildStub: ProxyHandler<object> = {
            get(_, prop) {
                if (typeof prop === 'symbol' || prop === 'toJSON' || prop === 'then') {
                    return undefined;
                }
                // Return a nested proxy so property chains (e.g. supabase.auth)
                // work during render for useEffect dependency arrays.
                return new Proxy(() => {}, {
                    get(_, nestedProp) {
                        if (typeof nestedProp === 'symbol') return undefined;
                        // Return no-op function for method access during SSR
                        return () => {
                            throw new Error(
                                `Supabase client method "${String(prop)}.${String(nestedProp)}()" ` +
                                `called during SSR/build. Ensure NEXT_PUBLIC_SUPABASE_URL and ` +
                                `NEXT_PUBLIC_SUPABASE_ANON_KEY are set.`
                            );
                        };
                    },
                    apply() {
                        throw new Error(
                            `Supabase client method "${String(prop)}()" called during SSR/build. ` +
                            `Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.`
                        );
                    },
                });
            },
        };
        return new Proxy({}, buildStub) as unknown as SupabaseClient;
    }

    return createBrowserClient(url, key);
}
