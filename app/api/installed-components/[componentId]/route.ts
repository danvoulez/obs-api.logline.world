import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { installedComponents } from '@/db/schema';

type Params = { params: Promise<{ componentId: string }> };

export async function DELETE(_req: NextRequest, { params }: Params): Promise<NextResponse> {
  const { componentId } = await params;
  await db.delete(installedComponents).where(eq(installedComponents.component_id, componentId));
  return NextResponse.json({ ok: true });
}
