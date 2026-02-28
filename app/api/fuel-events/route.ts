import { NextRequest, NextResponse } from 'next/server';
import { and, desc, eq } from 'drizzle-orm';
import { db } from '@/db';
import { serviceStatusLog } from '@/db/schema';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const appId = req.nextUrl.searchParams.get('app_id') ?? req.headers.get('x-app-id') ?? 'ublx';
  const workspaceId = req.headers.get('x-workspace-id') || 'default';
  const rows = await db.select().from(serviceStatusLog)
    .where(and(eq(serviceStatusLog.app_id, appId), eq(serviceStatusLog.workspace_id, workspaceId)))
    .orderBy(desc(serviceStatusLog.recorded_at))
    .limit(50);
  return NextResponse.json(rows.map((r) => ({ kind: r.service_name, status: r.status, cursor: r.id, recorded_at: r.recorded_at })));
}
