# Authentication Service

> User authentication with Supabase Auth

## Overview

KidBook Creator uses Supabase Auth for user authentication, supporting email/password and Google OAuth sign-in methods.

---

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  AuthContext    │────▶│  Supabase Client │────▶│  Supabase Auth  │
│  (React)        │     │  lib/supabase/   │     │  Service        │
└─────────────────┘     └──────────────────┘     └─────────────────┘
        │
        ▼
┌─────────────────┐
│  AuthModal      │
│  Component      │
└─────────────────┘
```

---

## Auth Context (`lib/auth/AuthContext.tsx`)

The `AuthProvider` wraps the app and provides authentication state and methods.

### Context Interface

```typescript
interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUpWithEmail: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signInWithGoogle: () => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
}
```

### Usage

```tsx
import { useAuth } from '@/lib/auth/AuthContext';

function MyComponent() {
  const { user, isLoading, signInWithEmail, signOut } = useAuth();

  if (isLoading) return <Loading />;
  if (!user) return <LoginPrompt />;

  return <Dashboard user={user} />;
}
```

---

## Authentication Methods

### Email/Password Sign Up

```typescript
const { error } = await signUpWithEmail(email, password);
if (error) {
  console.error('Sign up failed:', error.message);
}
```

- Sends confirmation email to user
- Redirects to `/auth/callback` after confirmation

### Email/Password Sign In

```typescript
const { error } = await signInWithEmail(email, password);
```

### Google OAuth

```typescript
const { error } = await signInWithGoogle();
```

- Redirects to Google for authentication
- Returns to `/auth/callback` after success

### Password Reset

```typescript
const { error } = await resetPassword(email);
```

- Sends password reset email
- Redirects to `/auth/reset-password`

### Sign Out

```typescript
await signOut();
```

---

## Auth Callback Route (`app/auth/callback/`)

Handles OAuth redirects and email confirmations:

1. Receives auth code from URL
2. Exchanges code for session
3. Redirects to home or intended destination

---

## Session Management

### Initial Session Check

On app load, `AuthProvider` checks for existing session with a 5-second timeout:

```typescript
const { data: { session } } = await supabase.auth.getSession();
```

### Real-time Auth State

Listens for auth state changes (login, logout, token refresh):

```typescript
supabase.auth.onAuthStateChange((event, session) => {
  setSession(session);
  setUser(session?.user ?? null);
});
```

---

## Protected Routes

### API Routes

All API routes check authentication:

```typescript
const supabase = await createClient();
const { data: { user }, error: authError } = await supabase.auth.getUser();

if (authError || !user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

### Client-Side Protection

```tsx
function ProtectedPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/');
    }
  }, [user, isLoading]);

  if (isLoading || !user) return null;
  return <Content />;
}
```

---

## AuthModal Component

Located at `components/AuthModal/`:

- Modal dialog for sign in/sign up
- Toggles between login and registration modes
- Supports email/password and Google OAuth
- Shows loading states and error messages

### Usage

```tsx
<AuthModal
  isOpen={showAuth}
  onClose={() => setShowAuth(false)}
  defaultMode="signin"
/>
```

---

## User Profiles

When a user signs up, a profile is automatically created via database trigger:

```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## Supabase Clients

### Server-Side (`lib/supabase/server.ts`)

```typescript
import { createClient } from '@/lib/supabase/server';

const supabase = await createClient();
```

- Uses cookies for session management
- Required for API routes and server components

### Client-Side (`lib/supabase/client.ts`)

```typescript
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();
```

- Browser-based client
- Used in React components

---

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # Server-only
```

---

## Security Considerations

1. **Row Level Security (RLS)** - All tables have RLS policies
2. **Service Role Key** - Only used server-side for webhooks
3. **Session Timeout** - 5-second timeout prevents app freeze
4. **HTTPS** - All auth requests over HTTPS

---

## Files

| File | Purpose |
|------|---------|
| `lib/auth/AuthContext.tsx` | React context provider |
| `lib/supabase/client.ts` | Browser Supabase client |
| `lib/supabase/server.ts` | Server Supabase client |
| `components/AuthModal/` | Sign in/up modal component |
| `app/auth/callback/` | OAuth callback handler |
| `app/auth/error/` | Auth error page |
| `middleware.ts` | Route protection middleware |
