
import { createClient } from '@supabase/supabase-js';
import { createModuleLogger } from '@/lib/logger';
import { env } from '@/lib/env';
import { withRetry, RETRY_CONFIGS } from '../retry';

const logger = createModuleLogger('upload');

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

export async function uploadImageToStorage(bookId: string, pageNumber: number, imageBuffer: Buffer): Promise<string> {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const fileName = `${bookId}/page_${pageNumber}_${Date.now()}.png`;
    logger.info({ fileName, size: imageBuffer.length }, 'Uploading image');

    return withRetry(async () => {
        const { data, error } = await supabase.storage
            .from('book-images')
            .upload(fileName, imageBuffer, {
                contentType: 'image/png',
                upsert: true
            });

        if (error) {
            logger.error({ err: error }, 'Upload error');
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
    logger.info({ fileName, size: imageBuffer.length }, 'Uploading reference image');

    return withRetry(async () => {
        const { error } = await supabase.storage
            .from('book-images')
            .upload(fileName, imageBuffer, {
                contentType: safeType,
                upsert: true
            });

        if (error) {
            logger.error({ err: error }, 'Reference upload error');
            throw error;
        }

        const { data: { publicUrl } } = supabase.storage.from('book-images').getPublicUrl(fileName);
        return publicUrl;
    }, RETRY_CONFIGS.supabaseStorage);
}
