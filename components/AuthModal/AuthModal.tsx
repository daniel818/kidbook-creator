'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/auth/AuthContext';
import { AuthError } from '@supabase/supabase-js';
import styles from './AuthModal.module.css';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialMode?: 'login' | 'signup';
}

export function AuthModal({ isOpen, onClose, initialMode = 'login' }: AuthModalProps) {
    const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>(initialMode);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const { signInWithEmail, signUpWithEmail, signInWithGoogle, resetPassword } = useAuth();

    const handleEmailAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        setIsLoading(true);

        try {
            // Create a timeout promise to prevent infinite loading
            const timeoutPromise = new Promise<{ error: { message: string } | null }>((_, reject) => {
                setTimeout(() => reject(new Error('Request timed out')), 15000);
            });

            let result: { error: AuthError | null } | { error: { message: string } | null };

            if (mode === 'login') {
                result = await Promise.race([
                    signInWithEmail(email, password),
                    timeoutPromise
                ]) as { error: AuthError | null };

                if (result.error) {
                    console.error('Login error:', result.error);
                    setError(result.error.message);
                } else {
                    onClose();
                }
            } else if (mode === 'signup') {
                result = await Promise.race([
                    signUpWithEmail(email, password),
                    timeoutPromise
                ]) as { error: AuthError | null };

                if (result.error) {
                    console.error('Signup error:', result.error);
                    setError(result.error.message);
                } else {
                    setSuccess('Check your email to confirm your account!');
                }
            } else if (mode === 'forgot') {
                result = await Promise.race([
                    resetPassword(email),
                    timeoutPromise
                ]) as { error: AuthError | null };

                if (result.error) {
                    console.error('Reset password error:', result.error);
                    setError(result.error.message);
                } else {
                    setSuccess('Check your email for a password reset link!');
                }
            }
        } catch (err: any) {
            console.error('Auth unexpected error:', err);
            setError(err.message || 'An unexpected error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleAuth = async () => {
        setError(null);
        const { error } = await signInWithGoogle();
        if (error) {
            setError(error.message);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                className={styles.overlay}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
            >
                <motion.div
                    className={styles.modal}
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <button className={styles.closeBtn} onClick={onClose}>×</button>

                    <div className={styles.header}>
                        <span className={styles.icon}>📚</span>
                        <h2 className={styles.title}>
                            {mode === 'login' && 'Welcome Back!'}
                            {mode === 'signup' && 'Create Account'}
                            {mode === 'forgot' && 'Reset Password'}
                        </h2>
                        <p className={styles.subtitle}>
                            {mode === 'login' && 'Sign in to save your books and order prints'}
                            {mode === 'signup' && 'Join us to create amazing books for your kids'}
                            {mode === 'forgot' && "Enter your email and we'll send you a reset link"}
                        </p>
                    </div>

                    {mode !== 'forgot' && (
                        <>
                            <button
                                className={styles.googleBtn}
                                onClick={handleGoogleAuth}
                                disabled={isLoading}
                            >
                                <svg viewBox="0 0 24 24" width="20" height="20">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                Continue with Google
                            </button>

                            <div className={styles.divider}>
                                <span>or</span>
                            </div>
                        </>
                    )}

                    <form onSubmit={handleEmailAuth} className={styles.form}>
                        <div className={styles.formGroup}>
                            <label>Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                required
                                disabled={isLoading}
                            />
                        </div>

                        {mode !== 'forgot' && (
                            <div className={styles.formGroup}>
                                <label>Password</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    minLength={6}
                                    disabled={isLoading}
                                />
                            </div>
                        )}

                        {error && (
                            <div className={styles.error}>
                                ⚠️ {error}
                            </div>
                        )}

                        {success && (
                            <div className={styles.success}>
                                ✅ {success}
                            </div>
                        )}

                        <button
                            type="submit"
                            className={styles.submitBtn}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <span className={styles.spinner}></span>
                            ) : (
                                <>
                                    {mode === 'login' && 'Sign In'}
                                    {mode === 'signup' && 'Create Account'}
                                    {mode === 'forgot' && 'Send Reset Link'}
                                </>
                            )}
                        </button>
                    </form>

                    <div className={styles.footer}>
                        {mode === 'login' && (
                            <>
                                <button
                                    className={styles.linkBtn}
                                    onClick={() => { setMode('forgot'); setError(null); setSuccess(null); }}
                                >
                                    Forgot password?
                                </button>
                                <p>
                                    Don&apos;t have an account?{' '}
                                    <button
                                        className={styles.linkBtn}
                                        onClick={() => { setMode('signup'); setError(null); setSuccess(null); }}
                                    >
                                        Sign up
                                    </button>
                                </p>
                            </>
                        )}
                        {mode === 'signup' && (
                            <p>
                                Already have an account?{' '}
                                <button
                                    className={styles.linkBtn}
                                    onClick={() => { setMode('login'); setError(null); setSuccess(null); }}
                                >
                                    Sign in
                                </button>
                            </p>
                        )}
                        {mode === 'forgot' && (
                            <button
                                className={styles.linkBtn}
                                onClick={() => { setMode('login'); setError(null); setSuccess(null); }}
                            >
                                ← Back to sign in
                            </button>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
