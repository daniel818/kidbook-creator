// ============================================
// Unlock Preview Book - Generate remaining images
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe/server';
import { generateIllustration } from '@/lib/gemini/client';
import { uploadImageToStorage } from '@/lib/supabase/upload';
import { env } from '@/lib/env';
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit';

interface RouteContext {
    params: Promise<{ bookId: string }>;
}

const logUnlock = (message: string, data?: unknown) => {
    const timestamp = new Date().toISOString();
    const logMsg = `[API unlock-book ${timestamp}] ${message}`;
    if (data !== undefined) {
        console.log(logMsg, data);
    } else {
        console.log(logMsg);
    }
};

export async function POST(request: NextRequest, context: RouteContext) {
    try {
        const { bookId } = await context.params;
        const supabase = await createClient();
        const adminDb = await createAdminClient();
        const sessionIdFromQuery = new URL(request.url).searchParams.get('session_id');
        logUnlock('Unlock request received', { bookId, hasSessionId: !!sessionIdFromQuery });

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        const hasUser = !authError && !!user;
        logUnlock('Auth status', { hasUser, userId: user?.id || null });

        // Require either a logged-in user or a valid Stripe session ID
        if (!hasUser && !sessionIdFromQuery) {
            logUnlock('Unauthorized: no user and no session id');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Rate limit by user ID or session ID (this route generates AI images)
        const rateLimitKey = hasUser && user ? `ai:${user.id}` : `ai:session:${sessionIdFromQuery}`;
        const rateResult = checkRateLimit(rateLimitKey, RATE_LIMITS.ai);
        if (!rateResult.allowed) {
            logUnlock('Rate limited', { key: rateLimitKey, retryAfter: rateResult.retryAfterSeconds });
            return rateLimitResponse(rateResult, 'Too many AI requests. Please wait before trying again.');
        }

        // When unauthenticated with a session_id, verify Stripe session first
        // to extract userId for ownership-scoped book lookup
        let sessionUserId: string | null = null;
        if (!hasUser && sessionIdFromQuery) {
            try {
                const session = await stripe.checkout.sessions.retrieve(sessionIdFromQuery);
                const isPaid = session.payment_status === 'paid' || session.status === 'complete';
                sessionUserId = session.metadata?.userId || null;
                const sessionBookId = session.metadata?.bookId;

                if (!isPaid || sessionBookId !== bookId || !sessionUserId) {
                    logUnlock('Stripe session validation failed for unauthenticated request', {
                        isPaid, sessionBookId, sessionUserId, bookId,
                    });
                    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
                }
            } catch (err) {
                console.error('[unlock-book] Stripe session verification failed', err);
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }
        }

        // Always use ownership-scoped query: user_id from session or authenticated user
        const ownerId = hasUser && user ? user.id : sessionUserId;
        if (!ownerId) {
            logUnlock('No owner ID resolved; rejecting');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const db = hasUser ? supabase : adminDb;

        const { data: book, error: bookError } = await db
            .from('books')
            .select('*, pages (*)')
            .eq('id', bookId)
            .eq('user_id', ownerId)
            .single();

        if (bookError || !book) {
            logUnlock('Book not found', { bookError });
            return NextResponse.json({ error: 'Book not found' }, { status: 404 });
        }

        const isPreview = book.is_preview || book.status === 'preview';
        logUnlock('Book state', {
            isPreview,
            status: book.status,
            digitalUnlockPaid: book.digital_unlock_paid,
            previewPageCount: book.preview_page_count,
        });
        if (!isPreview) {
            return NextResponse.json({ error: 'Book is already unlocked' }, { status: 400 });
        }
        if (!book.digital_unlock_paid) {
            if (sessionIdFromQuery) {
                try {
                    const session = await stripe.checkout.sessions.retrieve(sessionIdFromQuery);
                    const isPaid = session.payment_status === 'paid' || session.status === 'complete';
                    const sessionBookId = session.metadata?.bookId;
                    const metaUserId = session.metadata?.userId;
                    const bookUserId = (book.user_id as string | null) || null;
                    // Fail closed: if session has no userId in metadata, don't match
                    const userMatches = metaUserId ? metaUserId === bookUserId : false;
                    logUnlock('Stripe session verified', {
                        sessionId: session.id,
                        isPaid,
                        sessionBookId,
                        metaUserId,
                        bookUserId,
                        userMatches,
                    });
                    if (isPaid && sessionBookId === bookId && userMatches) {
                        await adminDb
                            .from('books')
                            .update({ digital_unlock_paid: true, digital_unlock_session_id: session.id })
                            .eq('id', bookId);
                        logUnlock('Marked digital unlock paid via session');
                    }
                } catch (err) {
                    console.error('[unlock-book] Stripe session query failed', err);
                    logUnlock('Stripe session query failed');
                }
            }

            // 1) If a paid print order exists, allow unlock
            const { data: paidOrders } = await db
                .from('orders')
                .select('id')
                .eq('book_id', bookId)
                .eq('payment_status', 'paid')
                .limit(1);

            if (paidOrders && paidOrders.length > 0) {
                await adminDb
                    .from('books')
                    .update({ digital_unlock_paid: true })
                    .eq('id', bookId);
            } else {
                // 2) Check digital unlock session
                const sessionId = book.digital_unlock_session_id as string | null;
                if (sessionId) {
                    try {
                        const session = await stripe.checkout.sessions.retrieve(sessionId);
                        if (session.payment_status === 'paid' || session.status === 'complete') {
                            await adminDb
                                .from('books')
                                .update({ digital_unlock_paid: true })
                                .eq('id', bookId);
                        }
                    } catch (err) {
                        console.error('[unlock-book] Stripe session check failed', err);
                    }
                } else {
                    // 3) Check latest print session if any (fallback)
                    const { data: latestOrder } = await db
                        .from('orders')
                        .select('stripe_checkout_session_id')
                        .eq('book_id', bookId)
                        .not('stripe_checkout_session_id', 'is', null)
                        .order('created_at', { ascending: false })
                        .limit(1)
                        .maybeSingle();

                    if (latestOrder?.stripe_checkout_session_id) {
                        try {
                            const session = await stripe.checkout.sessions.retrieve(latestOrder.stripe_checkout_session_id);
                            if (session.payment_status === 'paid' || session.status === 'complete') {
                                await adminDb
                                    .from('books')
                                    .update({ digital_unlock_paid: true })
                                    .eq('id', bookId);
                            }
                        } catch (err) {
                            console.error('[unlock-book] Stripe print session check failed', err);
                        }
                    }
                }

                const { data: refreshed } = await db
                    .from('books')
                    .select('digital_unlock_paid')
                    .eq('id', bookId)
                    .single();

                if (!refreshed?.digital_unlock_paid) {
                    logUnlock('Payment not confirmed; returning 402');
                    return NextResponse.json({ error: 'Payment not confirmed' }, { status: 402 });
                }
            }
        }

        const previewPageCount = Number(book.preview_page_count || 0);
        const characterDescription = book.character_description || `A cute child named ${book.child_name}`;
        const artStyle = book.art_style || 'storybook_classic';
        const imageQuality = book.image_quality || 'fast';
        const aspectRatio = book.print_format === 'square' ? '1:1' : '3:4';
        const language = book.language || 'en';
        const bookTitle = book.title || '';
        let referenceImage: string | undefined;
        const referenceUrl = book.reference_image_url as string | null;
        if (referenceUrl) {
            try {
                const resp = await fetch(referenceUrl);
                if (resp.ok) {
                    const contentType = resp.headers.get('content-type') || 'image/jpeg';
                    const buffer = Buffer.from(await resp.arrayBuffer());
                    referenceImage = `data:${contentType};base64,${buffer.toString('base64')}`;
                }
            } catch (err) {
                console.warn('Failed to load reference image', err);
            }
        }

        const pages = (book.pages || [])
            .sort((a: { page_number: number }, b: { page_number: number }) => a.page_number - b.page_number);

        // Load page 1's existing image as style reference for visual consistency
        let styleReferenceImage: string | undefined;
        const insidePages = pages.filter((p: { page_type: string }) => p.page_type === 'inside' || p.page_type === 'cover');
        const firstPage = insidePages.find((p: { page_number: number }) => p.page_number <= previewPageCount);
        if (firstPage) {
            const firstPageImages = Array.isArray(firstPage.image_elements) ? firstPage.image_elements : [];
            if (firstPageImages.length > 0 && firstPageImages[0]?.src) {
                const imgSrc = firstPageImages[0].src as string;
                // SSRF mitigation: only fetch from our own Supabase storage domain
                const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
                const isAllowedOrigin = imgSrc.startsWith(supabaseUrl) || imgSrc.startsWith('data:');
                if (!isAllowedOrigin) {
                    logUnlock('Skipping style reference: image URL not from allowed origin', { src: imgSrc.slice(0, 100) });
                } else {
                try {
                    const resp = await fetch(imgSrc);
                    if (resp.ok) {
                        const contentType = resp.headers.get('content-type') || 'image/png';
                        // Size guard: reject images over 10MB to prevent memory issues
                        const contentLength = parseInt(resp.headers.get('content-length') || '0', 10);
                        if (contentLength > 10 * 1024 * 1024) {
                            logUnlock('Skipping style reference: image too large', { contentLength });
                        } else {
                        const buffer = Buffer.from(await resp.arrayBuffer());
                        styleReferenceImage = `data:${contentType};base64,${buffer.toString('base64')}`;
                        logUnlock('Loaded page 1 image as style reference');
                        }
                    }
                } catch (err) {
                    console.warn('Failed to load page 1 image for style reference', err);
                }
                }
            }
        }

        const totalInsidePages = pages.filter((p: { page_type: string }) => p.page_type === 'inside' || p.page_type === 'cover').length;
        let updatedCount = 0;

        for (const page of pages) {
            const pageType = page.page_type as string;
            if (pageType !== 'inside') continue;

            const isLocked = page.page_number > previewPageCount;
            if (!isLocked) continue;

            const imageElements = Array.isArray(page.image_elements) ? page.image_elements : [];
            if (imageElements.length > 0 && imageElements[0]?.src) {
                continue;
            }

            const prompt = page.image_prompt as string | undefined;
            if (!prompt) continue;

            const { imageUrl } = await generateIllustration({
                scenePrompt: prompt,
                characterDescription,
                artStyle,
                quality: imageQuality,
                referenceImage,
                aspectRatio,
                language,
                styleReferenceImage,
                pageNumber: page.page_number,
                totalPages: totalInsidePages,
                bookTitle,
            });

            const matches = imageUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
            if (!matches || matches.length !== 3) continue;
            const imageBuffer = Buffer.from(matches[2], 'base64');

            const storedUrl = await uploadImageToStorage(bookId, page.page_number, imageBuffer);

            await db
                .from('pages')
                .update({
                    image_elements: [{
                        id: crypto.randomUUID(),
                        src: storedUrl,
                        x: 0,
                        y: 0,
                        width: 100,
                        height: 100,
                        rotation: 0
                    }]
                })
                .eq('id', page.id);

            updatedCount++;
        }

        const backCover = pages.find((p: { page_type: string }) => p.page_type === 'back');
        if (backCover) {
            const imageElements = Array.isArray(backCover.image_elements) ? backCover.image_elements : [];
            if (imageElements.length === 0 || !imageElements[0]?.src) {
                const backCoverPrompt = 'A magical background pattern or simple scenic view suitable for a book back cover. No characters, just atmosphere matching the book theme.';
                const { imageUrl } = await generateIllustration({
                    scenePrompt: backCoverPrompt,
                    characterDescription: '',
                    artStyle,
                    quality: imageQuality,
                    referenceImage: undefined,
                    aspectRatio,
                    language,
                    styleReferenceImage,
                    bookTitle,
                });

                const matches = imageUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
                if (matches && matches.length === 3) {
                    const imageBuffer = Buffer.from(matches[2], 'base64');
                    const storedUrl = await uploadImageToStorage(bookId, backCover.page_number, imageBuffer);
                    await db
                        .from('pages')
                        .update({
                            image_elements: [{
                                id: crypto.randomUUID(),
                                src: storedUrl,
                                x: 0,
                                y: 0,
                                width: 100,
                                height: 100,
                                rotation: 0
                            }]
                        })
                        .eq('id', backCover.id);
                }
            }
        }

        const nextStatus = book.status === 'ordered' ? 'ordered' : 'draft';

        await db
            .from('books')
            .update({
                status: nextStatus,
                is_preview: false,
                preview_page_count: 0,
                digital_unlock_paid: true
            })
            .eq('id', bookId);

        return NextResponse.json({ success: true, updatedImages: updatedCount });
    } catch (error) {
        console.error('[unlock-book]', error);
        return NextResponse.json({ error: 'Failed to unlock book' }, { status: 500 });
    }
}
