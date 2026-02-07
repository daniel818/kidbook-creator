// ============================================
// Structured Logger (Pino)
// ============================================
// Server-side JSON logger with request context support.
// Usage:
//   import { logger, createModuleLogger, createRequestLogger } from '@/lib/logger';
//   logger.info({ bookId }, 'Book created');
//   const log = createModuleLogger('gemini');
//   const reqLog = createRequestLogger(request);

import pino from 'pino';
import { v4 as uuidv4 } from 'uuid';
import type { NextRequest } from 'next/server';

const isProduction = process.env.NODE_ENV === 'production';
const logLevel = process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug');

export const logger = pino({
    level: logLevel,
    transport: isProduction
        ? undefined
        : { target: 'pino-pretty', options: { colorize: true } },
    base: {
        service: 'kidbook-creator',
        environment: process.env.NODE_ENV || 'development',
    },
    timestamp: pino.stdTimeFunctions.isoTime,
});

export function createModuleLogger(module: string) {
    return logger.child({ module });
}

export function createRequestLogger(request: NextRequest, userId?: string) {
    const requestId = request.headers.get('x-request-id') || uuidv4();
    return logger.child({
        requestId,
        method: request.method,
        path: request.nextUrl.pathname,
        ...(userId ? { userId } : {}),
    });
}
