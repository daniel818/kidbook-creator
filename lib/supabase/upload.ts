
import { createClient } from '@supabase/supabase-js';
import { env } from '@/lib/env';
import { withRetry, RETRY_CONFIGS } from '../retry';

function log(msg: string) {
    console.log(`[Upload] ${msg}`);
}

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

export async function uploadImageToStorage(bookId: string, pageNumber: number, imageBuffer: Buffer): Promise<string> {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const fileName = `${bookId}/page_${pageNumber}_${Date.now()}.png`;
    log(`Uploading ${fileName}, size: ${imageBuffer.length}`);

    return withRetry(async () => {
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

        const { data: { publicUrl } } = supabase.storage.from('book-images').getPublicUrl(fileName);
        return publicUrl;
    }, RETRY_CONFIGS.supabaseStorage);
}

export async function uploadReferenceImage(
    userId: string,
    bookId: string,
    imageBuffer: Buffer,
    contentType: string
): Promise<string> {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const safeType = contentType || 'image/jpeg';
    const ext = safeType.includes('png') ? 'png'
        : safeType.includes('webp') ? 'webp'
            : safeType.includes('gif') ? 'gif'
                : 'jpg';
    const fileName = `${userId}/${bookId}/reference.${ext}`;
    log(`Uploading reference image ${fileName}, size: ${imageBuffer.length}`);

    return withRetry(async () => {
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
    }, RETRY_CONFIGS.supabaseStorage);
}
