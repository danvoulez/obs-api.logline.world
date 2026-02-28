import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { appSettings } from '@/db/schema';

function parseValue(value: string): unknown {
  try { return JSON.parse(value); } catch { return value; }
}

export async function GET(): Promise<NextResponse> {
  const rows = await db.select().from(appSettings);
  return NextResponse.json(Object.fromEntries(rows.map((r) => [r.key, parseValue(r.value)])));
}

export async function PATCH(req: NextRequest): Promise<NextResponse> {
  const body = await req.json().catch(() => null) as { key?: string; value?: unknown } | null;
  if (!body?.key) return NextResponse.json({ error: 'key is required' }, { status: 400 });

  await db.insert(appSettings).values({ key: body.key, value: JSON.stringify(body.value ?? null) }).onConflictDoUpdate({
    target: appSettings.key,
    set: { value: JSON.stringify(body.value ?? null), updated_at: new Date() },
  });

  return NextResponse.json({ ok: true });
}
