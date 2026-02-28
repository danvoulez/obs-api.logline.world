import { NextRequest, NextResponse } from 'next/server';
import { and, asc, desc, eq } from 'drizzle-orm';
import { db } from '@/db';
import { chatMessages } from '@/db/schema';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const sessionId = req.nextUrl.searchParams.get('session_id') ?? '';
  if (!sessionId) return NextResponse.json([]);

  const workspaceId = req.headers.get('x-workspace-id') || 'default';
  const appId = req.headers.get('x-app-id') || 'ublx';

  const rows = await db.select().from(chatMessages)
    .where(and(eq(chatMessages.session_id, sessionId), eq(chatMessages.workspace_id, workspaceId), eq(chatMessages.app_id, appId)))
    .orderBy(asc(chatMessages.created_at));

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const workspaceId = req.headers.get('x-workspace-id') || 'default';
  const appId = req.headers.get('x-app-id') || 'ublx';
  const body = await req.json().catch(() => null) as Record<string, unknown> | null;
  if (!body?.session_id || !body?.role || !body?.content) {
    return NextResponse.json({ error: 'session_id, role and content are required' }, { status: 400 });
  }

  const [row] = await db.insert(chatMessages).values({
    id: crypto.randomUUID(),
    workspace_id: workspaceId,
    app_id: appId,
    session_id: String(body.session_id),
    panel_id: typeof body.panel_id === 'string' ? body.panel_id : null,
    instance_id: typeof body.instance_id === 'string' ? body.instance_id : null,
    role: String(body.role),
    content: String(body.content),
    model_used: typeof body.model_used === 'string' ? body.model_used : null,
    latency_ms: typeof body.latency_ms === 'number' ? body.latency_ms : null,
  }).returning();

  return NextResponse.json(row, { status: 201 });
}
