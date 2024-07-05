// app/api/[...route]/route.ts

import { NextRequest, NextResponse } from 'next/server';

const PROXYMAP = {
    'gumroad': 'api.gumroad.com',
    'lemon': 'api.lemonsqueezy.com',
    'groq': 'api.groq.com',
};

export const runtime = 'edge';

export async function GET(request: NextRequest, { params }: { params: { route: string[] } }) {
    return handleRequest(request, params.route);
}

export async function POST(request: NextRequest, { params }: { params: { route: string[] } }) {
    return handleRequest(request, params.route);
}

export async function PUT(request: NextRequest, { params }: { params: { route: string[] } }) {
    return handleRequest(request, params.route);
}

export async function DELETE(request: NextRequest, { params }: { params: { route: string[] } }) {
    return handleRequest(request, params.route);
}

async function handleRequest(request: NextRequest, routeParams: string[]) {
    const url = new URL(request.url);
    const search = url.search;

    const [app, ...rest] = routeParams;
    const realHost = PROXYMAP[app as keyof typeof PROXYMAP];

    if (!realHost) {
        return NextResponse.json({ error: 'App not found' }, { status: 404 });
    }

    const realUrl = `https://${realHost}/${rest.join('/')}${search}`;
    console.log(realUrl);

    let proxyBody: BodyInit | null = null;
    let proxyHeaders = new Headers(request.headers);

    // Handle multipart/form-data
    const contentType = request.headers.get('content-type');
    if (contentType && contentType.includes('multipart/form-data')) {
        const formData = await request.formData();
        const newFormData = new FormData();

        // Recreate the FormData to ensure proper structure
        for (const [key, value] of formData.entries()) {
            if (value instanceof File) {
                newFormData.append(key, value, value.name);
            } else {
                newFormData.append(key, value);
            }
        }

        proxyBody = newFormData;

        // Remove the content-type header to let the browser set it correctly
        proxyHeaders.delete('content-type');
    } else if (request.method !== 'GET' && request.method !== 'HEAD') {
        proxyBody = await request.text();
    }

    const proxyRequest = new Request(realUrl, {
        method: request.method,
        headers: proxyHeaders,
        body: proxyBody,
    });

    try {
        const response = await fetch(proxyRequest);
        const responseBody = await response.arrayBuffer();
        return new NextResponse(responseBody, {
            status: response.status,
            headers: response.headers,
        });
    } catch (error) {
        console.error('Error fetching the real URL:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}