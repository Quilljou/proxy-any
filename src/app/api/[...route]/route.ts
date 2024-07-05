// app/api/[...route]/route.ts

import { NextRequest, NextResponse } from 'next/server';

const PROXYMAP = {
    'gumroad': 'api.gumroad.com',
    'lemon': 'api.lemonsqueezy.com',
    'groq': 'api.groq.com',
};

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

    const proxyRequest = new Request(realUrl, {
        method: request.method,
        headers: request.headers,
        body: request.method !== 'GET' && request.method !== 'HEAD' ? await request.text() : null,
    });

    try {
        const response = await fetch(proxyRequest);
        const responseBody = await response.text();
        return new NextResponse(responseBody, {
            status: response.status,
            headers: response.headers,
        });
    } catch (error) {
        console.error('Error fetching the real URL:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}