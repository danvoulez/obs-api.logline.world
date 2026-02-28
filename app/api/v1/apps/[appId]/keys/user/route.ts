import { NextRequest, NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { db } from '@/db';
import { userProviderKeys } from '@/db/schema';
import { getUserFromAuthHeader } from '@/lib/auth/supabase-server';

type Params = { params: Promise<{ appId: string }> };

export async function GET(req: NextRequest, { params }: Params): Promise<NextResponse> {
  const authUser = await getUserFromAuthHeader(req.headers.get('authorization'));
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { appId } = await params;
  const tenantId = req.nextUrl.searchParams.get('tenant_id');
  if (!tenantId) return NextResponse.json({ error: 'tenant_id is required' }, { status: 400 });

  const rows = await db.select().from(userProviderKeys).where(and(
    eq(userProviderKeys.app_id, appId),
    eq(userProviderKeys.tenant_id, tenantId),
    eq(userProviderKeys.user_id, authUser.id),
  ));
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest, { params }: Params): Promise<NextResponse> {
  const authUser = await getUserFromAuthHeader(req.headers.get('authorization'));
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { appId } = await params;
  const body = await req.json().catch(() => null) as Record<string, unknown> | null;
  if (!body?.tenant_id || !body.provider || !body.key_label || !body.encrypted_key) {
    return NextResponse.json({ error: 'tenant_id, provider, key_label and encrypted_key are required' }, { status: 400 });
  }

  const [row] = await db.insert(userProviderKeys).values({
    key_id: crypto.randomUUID(),
    tenant_id: String(body.tenant_id),
    app_id: appId,
    user_id: authUser.id,
    provider: String(body.provider),
    key_label: String(body.key_label),
    encrypted_key: String(body.encrypted_key),
    metadata: (body.metadata && typeof body.metadata === 'object') ? body.metadata : {},
  }).returning();

  return NextResponse.json(row, { status: 201 });
}
