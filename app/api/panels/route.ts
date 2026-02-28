import { NextRequest, NextResponse } from 'next/server';
import { asc, eq } from 'drizzle-orm';
import { db } from '@/db';
import { panels } from '@/db/schema';

function scope(req: NextRequest) {
  return {
    workspaceId: req.headers.get('x-workspace-id') || 'default',
    appId: req.headers.get('x-app-id') || 'ublx',
  };
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { workspaceId, appId } = scope(req);
  const rows = await db.select().from(panels)
    .where(eq(panels.workspace_id, workspaceId))
    .orderBy(asc(panels.position));

  return NextResponse.json(rows.map((p) => ({ ...p, app_id: p.app_id || appId })));
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const { workspaceId, appId } = scope(req);
  const body = await req.json().catch(() => null) as { name?: string } | null;
  const name = body?.name?.trim() || 'New Tab';

  const [created] = await db.insert(panels).values({
    panel_id: crypto.randomUUID(),
    workspace_id: workspaceId,
    app_id: appId,
    name,
    position: 0,
  }).returning();

  return NextResponse.json(created, { status: 201 });
}
