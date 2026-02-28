import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { panelSettings } from '@/db/schema';

type Params = { params: Promise<{ panelId: string }> };

function asObj(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value as Record<string, unknown>;
  return {};
}

export async function GET(_req: NextRequest, { params }: Params): Promise<NextResponse> {
  const { panelId } = await params;
  const [row] = await db.select().from(panelSettings).where(eq(panelSettings.panel_id, panelId));
  return NextResponse.json({ panel_id: panelId, settings: row ? JSON.parse(row.settings || '{}') : {} });
}

export async function PUT(req: NextRequest, { params }: Params): Promise<NextResponse> {
  const { panelId } = await params;
  const body = await req.json().catch(() => ({}));
  const settings = asObj(body);
  await db.insert(panelSettings).values({ panel_id: panelId, settings: JSON.stringify(settings) }).onConflictDoUpdate({
    target: panelSettings.panel_id,
    set: { settings: JSON.stringify(settings), updated_at: new Date() },
  });
  return NextResponse.json({ ok: true });
}
