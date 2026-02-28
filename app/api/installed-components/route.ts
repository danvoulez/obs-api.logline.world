import { NextRequest, NextResponse } from 'next/server';
import { desc, eq } from 'drizzle-orm';
import { db } from '@/db';
import { installedComponents } from '@/db/schema';

export async function GET(): Promise<NextResponse> {
  const rows = await db.select().from(installedComponents).orderBy(desc(installedComponents.installed_at));
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = await req.json().catch(() => null) as { componentId?: string } | null;
  if (!body?.componentId) return NextResponse.json({ error: 'componentId is required' }, { status: 400 });

  const [row] = await db.insert(installedComponents).values({ component_id: body.componentId })
    .onConflictDoNothing()
    .returning();

  if (!row) {
    const [existing] = await db.select().from(installedComponents).where(eq(installedComponents.component_id, body.componentId));
    return NextResponse.json(existing);
  }

  return NextResponse.json(row, { status: 201 });
}
