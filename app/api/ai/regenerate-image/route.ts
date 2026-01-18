
import { NextRequest, NextResponse } from 'next/server';
import { generateIllustration } from '@/lib/gemini/client';
import { uploadImageToStorage } from '@/lib/supabase/upload';

import * as fs from 'fs';
import * as path from 'path';

function log(msg: string, data?: any) {
    const logPath = path.join(process.cwd(), 'regeneration_debug.log');
    const time = new Date().toISOString();
    const logMsg = `${time}: ${msg} ${data ? JSON.stringify(data) : ''}\n`;
    try {
        fs.appendFileSync(logPath, logMsg);
    } catch (e) {
        console.error('Failed to write log', e);
    }
    console.log(`[Regenerate] ${msg}`, data || '');
}

export async function POST(req: NextRequest) {
    log('Request received');
    try {
        const body = await req.json();
        const { bookId, pageNumber, prompt, currentImageContext, style, quality } = body;
        log('Parsed body', { bookId, pageNumber, hasPrompt: !!prompt });

        if (!bookId || !pageNumber || !prompt) {
            log('Missing fields');
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        log(`Starting generation for book ${bookId} page ${pageNumber}`);

        // 1. Generate new image
        log('Calling generateIllustration...');
        const imageBase64 = await generateIllustration(
            prompt,
            style || 'whimsical', // default style
            currentImageContext,
            quality || 'fast'
        );
        log('generateIllustration returned', { length: imageBase64?.length });

        if (!imageBase64) {
            throw new Error('Failed to generate image (empty response)');
        }

        // Convert base64 to buffer
        const matches = imageBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (!matches || matches.length !== 3) {
            log('Invalid base64 format');
            throw new Error('Invalid image data returned from generator');
        }
        const imageBuffer = Buffer.from(matches[2], 'base64');
        log(`Buffer created: ${imageBuffer.length} bytes`);

        // 2. Upload to storage
        log('Uploading to storage...');
        const imageUrl = await uploadImageToStorage(bookId, pageNumber, imageBuffer);

        log(`Upload success: ${imageUrl}`);

        return NextResponse.json({ imageUrl });

    } catch (error: any) {
        log('Error in regeneration', error.message + '\n' + error.stack);
        return NextResponse.json(
            { error: 'Failed to regenerate image: ' + error.message },
            { status: 500 }
        );
    }
}
