import { NextRequest, NextResponse } from 'next/server';

type Params = { params: Promise<{ path: string[] }> };
type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

async function proxy(req: NextRequest, { params }: Params, method: Method): Promise<NextResponse> {
  const { path } = await params;
  const targetBase = req.headers.get('x-llm-gateway-base-url') || process.env.LLM_GATEWAY_BASE_URL;
  if (!targetBase) return NextResponse.json({ error: 'Missing x-llm-gateway-base-url' }, { status: 400 });

  const normalizedBase = targetBase.replace(/\/$/, '');
  const pathname = path.length ? `/${path.join('/')}` : '';
  const url = `${normalizedBase}${pathname}${req.nextUrl.search || ''}`;

  const headers = new Headers();
  const upstreamToken = req.headers.get('x-llm-gateway-token');
  if (upstreamToken) headers.set('Authorization', `Bearer ${upstreamToken}`);

  let body: string | undefined;
  if (method !== 'GET') {
    body = await req.text();
    headers.set('Content-Type', 'application/json');
  }

  const upstream = await fetch(url, {
    method,
    headers,
    body,
    cache: 'no-store',
  });

  const text = await upstream.text();
  return new NextResponse(text, {
    status: upstream.status,
    headers: {
      'content-type': upstream.headers.get('content-type') || 'application/json',
      'cache-control': 'no-store',
    },
  });
}

export async function GET(req: NextRequest, ctx: Params) { return proxy(req, ctx, 'GET'); }
export async function POST(req: NextRequest, ctx: Params) { return proxy(req, ctx, 'POST'); }
export async function PUT(req: NextRequest, ctx: Params) { return proxy(req, ctx, 'PUT'); }
export async function PATCH(req: NextRequest, ctx: Params) { return proxy(req, ctx, 'PATCH'); }
export async function DELETE(req: NextRequest, ctx: Params) { return proxy(req, ctx, 'DELETE'); }
