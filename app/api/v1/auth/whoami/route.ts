import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { tenantMemberships, users } from '@/db/schema';
import { getUserFromAuthHeader } from '@/lib/auth/supabase-server';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const authUser = await getUserFromAuthHeader(req.headers.get('authorization'));
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [user] = await db.select().from(users).where(eq(users.user_id, authUser.id));
  const memberships = await db.select().from(tenantMemberships).where(eq(tenantMemberships.user_id, authUser.id));

  return NextResponse.json({
    user: user ?? { user_id: authUser.id, email: authUser.email ?? null, display_name: authUser.user_metadata?.display_name ?? null },
    memberships,
  });
}
