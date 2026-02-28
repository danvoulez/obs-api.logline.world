import { NextRequest, NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { db } from '@/db';
import { panelComponents } from '@/db/schema';

type Params = { params: Promise<{ panelId: string; instanceId: string }> };

export async function PATCH(req: NextRequest, { params }: Params): Promise<NextResponse> {
  const { panelId, instanceId } = await params;
  const body = await req.json().catch(() => null) as {
    front_props?: Record<string, unknown>;
    rect?: { x?: number; y?: number; w?: number; h?: number };
  } | null;

  const updates: Partial<typeof panelComponents.$inferInsert> = { updated_at: new Date() };
  if (body?.front_props) updates.front_props = JSON.stringify(body.front_props);
  if (body?.rect) {
    if (typeof body.rect.x === 'number') updates.rect_x = body.rect.x;
    if (typeof body.rect.y === 'number') updates.rect_y = body.rect.y;
    if (typeof body.rect.w === 'number') updates.rect_w = body.rect.w;
    if (typeof body.rect.h === 'number') updates.rect_h = body.rect.h;
  }

  await db.update(panelComponents)
    .set(updates)
    .where(and(eq(panelComponents.panel_id, panelId), eq(panelComponents.instance_id, instanceId)));

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: Params): Promise<NextResponse> {
  const { panelId, instanceId } = await params;
  await db.delete(panelComponents)
    .where(and(eq(panelComponents.panel_id, panelId), eq(panelComponents.instance_id, instanceId)));
  return NextResponse.json({ ok: true });
}
