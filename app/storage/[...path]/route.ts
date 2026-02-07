export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { env } from '@/lib/env';

const SUPABASE_STORAGE_ORIGIN = env.SUPABASE_STORAGE_ORIGIN;

async function proxyStorage(request: Request, params: { path?: string[] } | Promise<{ path?: string[] }>) {
    try {
        const resolvedParams = await Promise.resolve(params);
        const rawPath = resolvedParams?.path;
        console.log('[Storage Proxy] Params:', resolvedParams);
        const path = Array.isArray(rawPath) ? rawPath.join('/') : rawPath;
        if (!path) {
            return new Response('Missing storage path', { status: 400 });
        }

        const target = new URL(SUPABASE_STORAGE_ORIGIN);
        target.pathname = `/storage/${path}`;
        target.search = new URL(request.url).search;

        const headers = new Headers(request.headers);
        headers.delete('host');

        const body = request.method === 'GET' || request.method === 'HEAD'
            ? undefined
            : await request.arrayBuffer();

        const upstream = await fetch(target, {
            method: request.method,
            headers,
            body,
            redirect: 'manual',
        });

        return new Response(upstream.body, {
            status: upstream.status,
            headers: upstream.headers,
        });
    } catch (error) {
        console.error('[Storage Proxy] Error:', error);
        return new Response('Storage proxy error', { status: 502 });
    }
}

export async function GET(request: Request, context: { params: Promise<{ path: string[] }> }) {
    return proxyStorage(request, context.params);
}

export async function HEAD(request: Request, context: { params: Promise<{ path: string[] }> }) {
    return proxyStorage(request, context.params);
}

export async function POST(request: Request, context: { params: Promise<{ path: string[] }> }) {
    return proxyStorage(request, context.params);
}

export async function PUT(request: Request, context: { params: Promise<{ path: string[] }> }) {
    return proxyStorage(request, context.params);
}

export async function PATCH(request: Request, context: { params: Promise<{ path: string[] }> }) {
    return proxyStorage(request, context.params);
}

export async function DELETE(request: Request, context: { params: Promise<{ path: string[] }> }) {
    return proxyStorage(request, context.params);
}

export async function OPTIONS(request: Request, context: { params: Promise<{ path: string[] }> }) {
    return proxyStorage(request, context.params);
}
