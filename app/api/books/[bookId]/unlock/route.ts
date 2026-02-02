// ============================================
// Unlock Preview Book - Generate remaining images
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe/server';
import * as fs from 'fs';
import * as path from 'path';
import { generateIllustration } from '@/lib/gemini/client';
import { uploadImageToStorage } from '@/lib/supabase/upload';

interface RouteContext {
    params: Promise<{ bookId: string }>;
}

const logUnlock = (message: string, data?: unknown) => {
    const timestamp = new Date().toISOString();
    const logMsg = `[API unlock-book ${timestamp}] ${message}`;
    try {
        const logPath = path.join(process.cwd(), 'api_debug.log');
        fs.appendFileSync(logPath, `${logMsg} ${data ? JSON.stringify(data) : ''}\n`);
    } catch {
        // ignore
    }
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
        const db = hasUser ? supabase : adminDb;
        logUnlock('Auth status', { hasUser, userId: user?.id || null });

        const bookQuery = db
            .from('books')
            .select('*, pages (*)')
            .eq('id', bookId);
        if (hasUser && user) {
            bookQuery.eq('user_id', user.id);
        }

        const { data: book, error: bookError } = await bookQuery.single();

        if (bookError || !book) {
            logUnlock('Book not found', { bookError });
            return NextResponse.json({ error: 'Book not found' }, { status: 404 });
        }

        if (!hasUser && !sessionIdFromQuery) {
            logUnlock('Unauthorized: no user and no session id');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
                    const sessionUserId = session.metadata?.userId;
                    const bookUserId = (book.user_id as string | null) || null;
                    const userMatches = sessionUserId ? sessionUserId === bookUserId : true;
                    logUnlock('Stripe session verified', {
                        sessionId: session.id,
                        isPaid,
                        sessionBookId,
                        sessionUserId,
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

            const { imageUrl } = await generateIllustration(
                prompt,
                characterDescription,
                artStyle,
                imageQuality,
                referenceImage,
                aspectRatio,
                language
            );

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
                const { imageUrl } = await generateIllustration(
                    backCoverPrompt,
                    '',
                    artStyle,
                    imageQuality,
                    undefined,
                    aspectRatio,
                    language
                );

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
