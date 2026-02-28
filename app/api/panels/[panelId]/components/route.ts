import { NextRequest, NextResponse } from 'next/server';
import { asc, eq } from 'drizzle-orm';
import { db } from '@/db';
import { panelComponents } from '@/db/schema';

type Params = { params: Promise<{ panelId: string }> };

function toResponseRow(row: typeof panelComponents.$inferSelect) {
  return {
    ...row,
    rect: { x: row.rect_x, y: row.rect_y, w: row.rect_w, h: row.rect_h },
    front_props: JSON.parse(row.front_props || '{}') as Record<string, unknown>,
  };
}

export async function GET(_req: NextRequest, { params }: Params): Promise<NextResponse> {
  const { panelId } = await params;
  const rows = await db.select().from(panelComponents)
    .where(eq(panelComponents.panel_id, panelId))
    .orderBy(asc(panelComponents.position));
  return NextResponse.json(rows.map(toResponseRow));
}

export async function POST(req: NextRequest, { params }: Params): Promise<NextResponse> {
  const { panelId } = await params;
  const body = await req.json().catch(() => null) as { componentId?: string } | null;
  if (!body?.componentId) return NextResponse.json({ error: 'componentId is required' }, { status: 400 });

  const [created] = await db.insert(panelComponents).values({
    instance_id: crypto.randomUUID(),
    panel_id: panelId,
    component_id: body.componentId,
    front_props: '{}',
    position: 0,
  }).returning();

  return NextResponse.json(toResponseRow(created), { status: 201 });
}
