
import { createClient } from '@supabase/supabase-js';

function log(msg: string) {
    console.log(`[Upload] ${msg}`);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
    log('CRITICAL: SUPABASE_SERVICE_ROLE_KEY is missing!');
}

// Create a direct client with service key for admin access (uploads)
// We handle the case where key is missing by not creating client immediately or handling error later?
// But top-level await isn't allowed here easily.
// const supabase = createClient(supabaseUrl, supabaseServiceKey || '');

export async function uploadImageToStorage(bookId: string, pageNumber: number, imageBuffer: Buffer): Promise<string> {
    if (!supabaseServiceKey) {
        throw new Error('Server misconfiguration: Missing SUPABASE_SERVICE_ROLE_KEY');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const fileName = `${bookId}/page_${pageNumber}_${Date.now()}.png`;
    log(`Uploading ${fileName}, size: ${imageBuffer.length}`);

    const { data, error } = await supabase.storage
        .from('book-images')
        .upload(fileName, imageBuffer, {
            contentType: 'image/png',
            upsert: true
        });

    if (error) {
        log(`Upload error: ${JSON.stringify(error)}`);
        throw error;
    }

    const { data: { publicUrl } } = supabase.storage.from('book-images').getPublicUrl(fileName); // Fixed bucket name here too?
    // Let's check which bucket usage is correct.
    return publicUrl;
}

export async function uploadReferenceImage(
    userId: string,
    bookId: string,
    imageBuffer: Buffer,
    contentType: string
): Promise<string> {
    if (!supabaseServiceKey) {
        throw new Error('Server misconfiguration: Missing SUPABASE_SERVICE_ROLE_KEY');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const safeType = contentType || 'image/jpeg';
    const ext = safeType.includes('png') ? 'png'
        : safeType.includes('webp') ? 'webp'
            : safeType.includes('gif') ? 'gif'
                : 'jpg';
    const fileName = `${userId}/${bookId}/reference.${ext}`;
    log(`Uploading reference image ${fileName}, size: ${imageBuffer.length}`);

    const { error } = await supabase.storage
        .from('book-images')
        .upload(fileName, imageBuffer, {
            contentType: safeType,
            upsert: true
        });

    if (error) {
        log(`Reference upload error: ${JSON.stringify(error)}`);
        throw error;
    }

    const { data: { publicUrl } } = supabase.storage.from('book-images').getPublicUrl(fileName);
    return publicUrl;
}
