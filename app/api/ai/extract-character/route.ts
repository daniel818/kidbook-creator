// ============================================
// Character Extraction API
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { extractCharacterFromPhoto } from '@/lib/gemini/client';
import { createRequestLogger } from '@/lib/logger';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get('photo') as File;

        if (!file) {
            return NextResponse.json(
                { error: 'No photo provided' },
                { status: 400 }
            );
        }

        // Convert file to base64
        const arrayBuffer = await file.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString('base64');

        const characterDescription = await extractCharacterFromPhoto(base64);

        return NextResponse.json({
            success: true,
            characterDescription,
        });
    } catch (error) {
        const logger = createRequestLogger(request);
        logger.error({ err: error }, 'Character extraction error');
        return NextResponse.json(
            { error: 'Failed to extract character from photo' },
            { status: 500 }
        );
    }
}
