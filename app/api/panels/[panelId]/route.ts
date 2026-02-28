import { NextRequest, NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { db } from '@/db';
import { panels } from '@/db/schema';

type Params = { params: Promise<{ panelId: string }> };

export async function PATCH(req: NextRequest, { params }: Params): Promise<NextResponse> {
  const { panelId } = await params;
  const workspaceId = req.headers.get('x-workspace-id') || 'default';
  const body = await req.json().catch(() => null) as { name?: string } | null;

  const [updated] = await db.update(panels)
    .set({ name: body?.name?.trim() || 'Untitled', updated_at: new Date() })
    .where(and(eq(panels.panel_id, panelId), eq(panels.workspace_id, workspaceId)))
    .returning();

  if (!updated) return NextResponse.json({ error: 'Panel not found' }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: Params): Promise<NextResponse> {
  const { panelId } = await params;
  const workspaceId = req.headers.get('x-workspace-id') || 'default';

  const deleted = await db.delete(panels)
    .where(and(eq(panels.panel_id, panelId), eq(panels.workspace_id, workspaceId)))
    .returning({ panel_id: panels.panel_id });

  if (deleted.length === 0) return NextResponse.json({ error: 'Panel not found' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
