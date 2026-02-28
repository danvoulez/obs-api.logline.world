import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { tabMeta } from '@/db/schema';

type Params = { params: Promise<{ panelId: string }> };

export async function GET(_req: NextRequest, { params }: Params): Promise<NextResponse> {
  const { panelId } = await params;
  const [row] = await db.select().from(tabMeta).where(eq(tabMeta.panel_id, panelId));
  return NextResponse.json(row ?? null);
}

export async function PUT(req: NextRequest, { params }: Params): Promise<NextResponse> {
  const { panelId } = await params;
  const body = await req.json().catch(() => ({})) as { icon?: string; label?: string; shortcut?: number };
  await db.insert(tabMeta).values({ panel_id: panelId, ...body }).onConflictDoUpdate({
    target: tabMeta.panel_id,
    set: { ...body },
  });
  return NextResponse.json({ ok: true });
}
