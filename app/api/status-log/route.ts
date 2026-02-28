import { NextRequest, NextResponse } from 'next/server';
import { and, desc, eq } from 'drizzle-orm';
import { db } from '@/db';
import { serviceStatusLog } from '@/db/schema';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const workspaceId = req.headers.get('x-workspace-id') || 'default';
  const appId = req.headers.get('x-app-id') || 'ublx';
  const limit = Math.max(1, Math.min(200, Number(req.nextUrl.searchParams.get('limit') ?? '50')));

  const rows = await db.select().from(serviceStatusLog)
    .where(and(eq(serviceStatusLog.workspace_id, workspaceId), eq(serviceStatusLog.app_id, appId)))
    .orderBy(desc(serviceStatusLog.recorded_at))
    .limit(limit);

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const workspaceId = req.headers.get('x-workspace-id') || 'default';
  const appId = req.headers.get('x-app-id') || 'ublx';
  const body = await req.json().catch(() => null) as { service_name?: string; status?: string; latency_ms?: number } | null;
  if (!body?.service_name || !body?.status) return NextResponse.json({ error: 'service_name and status are required' }, { status: 400 });

  const [row] = await db.insert(serviceStatusLog).values({
    workspace_id: workspaceId,
    app_id: appId,
    service_name: body.service_name,
    status: body.status,
    latency_ms: typeof body.latency_ms === 'number' ? body.latency_ms : null,
  }).returning();

  return NextResponse.json(row, { status: 201 });
}
