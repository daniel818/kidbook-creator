// ============================================
// Image Upload API
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Check if user is authenticated
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Rate limit uploads to prevent storage abuse
        const rateResult = checkRateLimit(`upload:${user.id}`, RATE_LIMITS.upload);
        if (!rateResult.allowed) {
            console.log(`[Rate Limit] upload blocked for user ${user.id}`);
            return rateLimitResponse(rateResult, 'Too many upload requests. Please wait before trying again.');
        }

        const formData = await request.formData();
        const file = formData.get('file') as File;
        const bookId = formData.get('bookId') as string;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json(
                { error: 'Invalid file type. Allowed: JPEG, PNG, GIF, WebP' },
                { status: 400 }
            );
        }

        // Validate file size (max 10MB)
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
            return NextResponse.json(
                { error: 'File too large. Maximum size is 10MB' },
                { status: 400 }
            );
        }

        // Generate unique filename
        const ext = file.name.split('.').pop();
        const filename = `${crypto.randomUUID()}.${ext}`;
        const path = `${user.id}/${bookId || 'general'}/${filename}`;

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
            .from('book-images')
            .upload(path, file, {
                contentType: file.type,
                cacheControl: '3600',
                upsert: false,
            });

        if (error) {
            console.error('Upload error:', error);
            return NextResponse.json(
                { error: 'Failed to upload image' },
                { status: 500 }
            );
        }

        // Get signed URL for private bucket (expires in 1 hour)
        const { data: signedUrlData, error: signedUrlError } = await supabase.storage
            .from('book-images')
            .createSignedUrl(data.path, 60 * 60); // 1 hour expiry

        if (signedUrlError) {
            console.error('Signed URL error:', signedUrlError);
            return NextResponse.json(
                { error: 'Failed to generate image URL' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            url: signedUrlData.signedUrl,
            path: data.path,
        });
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// DELETE image
export async function DELETE(request: NextRequest) {
    try {
        const supabase = await createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { path } = await request.json();

        if (!path) {
            return NextResponse.json({ error: 'No path provided' }, { status: 400 });
        }

        // Ensure user can only delete their own images
        if (!path.startsWith(`${user.id}/`)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { error } = await supabase.storage
            .from('book-images')
            .remove([path]);

        if (error) {
            console.error('Delete error:', error);
            return NextResponse.json(
                { error: 'Failed to delete image' },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
