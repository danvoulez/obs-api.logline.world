import { NextRequest, NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { db } from '@/db';
import { appSettings, instanceConfigs, panelComponents, panelSettings } from '@/db/schema';

type Params = { params: Promise<{ instanceId: string }> };

function asObj(value: unknown): Record<string, unknown> {
  if (!value) return {};
  if (typeof value === 'string') {
    try { return JSON.parse(value) as Record<string, unknown>; } catch { return {}; }
  }
  return typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

export async function GET(_req: NextRequest, { params }: Params): Promise<NextResponse> {
  const { instanceId } = await params;
  const [instance] = await db.select().from(panelComponents).where(eq(panelComponents.instance_id, instanceId));
  if (!instance) return NextResponse.json({ error: 'Instance not found' }, { status: 404 });

  const [instanceCfg] = await db.select().from(instanceConfigs).where(eq(instanceConfigs.instance_id, instanceId));
  const [panelCfg] = await db.select().from(panelSettings).where(eq(panelSettings.panel_id, instance.panel_id));
  const appRows = await db.select().from(appSettings);
  const appCfg = Object.fromEntries(appRows.map((r) => [r.key, asObj(r.value)]));

  const appLayer = { ...appCfg };
  const panelLayer = asObj(panelCfg?.settings);
  const instanceLayer = { ...asObj(instance.front_props), ...asObj(instanceCfg) };
  const effective = { ...appLayer, ...panelLayer, ...instanceLayer };

  return NextResponse.json({
    instance_id: instanceId,
    panel_id: instance.panel_id,
    component_id: instance.component_id,
    layers: { app: appLayer, panel: panelLayer, instance: instanceLayer },
    effective,
    bindings: asObj((effective as Record<string, unknown>).tag_bindings),
    binding_sources: {},
    missing_required_tags: [],
  });
}
