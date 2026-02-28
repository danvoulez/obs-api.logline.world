import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { tenants } from '@/db/schema';

export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = await req.json().catch(() => null) as { slug?: string } | null;
  if (!body?.slug) return NextResponse.json({ error: 'slug is required' }, { status: 400 });
  const [tenant] = await db.select().from(tenants).where(eq(tenants.slug, body.slug));
  if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
  return NextResponse.json(tenant);
}
