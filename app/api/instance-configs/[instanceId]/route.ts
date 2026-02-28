import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { instanceConfigs } from '@/db/schema';

type Params = { params: Promise<{ instanceId: string }> };

export async function GET(_req: NextRequest, { params }: Params): Promise<NextResponse> {
  const { instanceId } = await params;
  const [row] = await db.select().from(instanceConfigs).where(eq(instanceConfigs.instance_id, instanceId));
  return NextResponse.json(row ?? {});
}

export async function PUT(req: NextRequest, { params }: Params): Promise<NextResponse> {
  const { instanceId } = await params;
  const body = await req.json().catch(() => ({})) as Record<string, unknown>;

  const values: typeof instanceConfigs.$inferInsert = {
    instance_id: instanceId,
    source_hub: typeof body.source_hub === 'string' ? body.source_hub : null,
    source_origin: typeof body.source_origin === 'string' ? body.source_origin : null,
    source_auth_ref: typeof body.source_auth_ref === 'string' ? body.source_auth_ref : null,
    source_mode: typeof body.source_mode === 'string' ? body.source_mode : null,
    source_interval_ms: typeof body.source_interval_ms === 'number' ? body.source_interval_ms : null,
    proc_executor: typeof body.proc_executor === 'string' ? body.proc_executor : null,
    proc_command: typeof body.proc_command === 'string' ? body.proc_command : null,
    proc_args: JSON.stringify(body.proc_args ?? []),
    proc_timeout_ms: typeof body.proc_timeout_ms === 'number' ? body.proc_timeout_ms : null,
    proc_retries: typeof body.proc_retries === 'number' ? body.proc_retries : null,
    proc_backoff: typeof body.proc_backoff === 'string' ? body.proc_backoff : null,
    proc_error_mode: typeof body.proc_error_mode === 'string' ? body.proc_error_mode : null,
    updated_at: new Date(),
  };

  await db.insert(instanceConfigs).values(values).onConflictDoUpdate({
    target: instanceConfigs.instance_id,
    set: { ...values, instance_id: undefined, updated_at: new Date() },
  });

  return NextResponse.json({ ok: true });
}
