import { NextRequest, NextResponse } from 'next/server';
import { asc, eq } from 'drizzle-orm';
import { db } from '@/db';
import { panels, panelComponents } from '@/db/schema';

function scope(req: NextRequest) {
  return {
    workspaceId: req.headers.get('x-workspace-id') || 'default',
    appId: req.headers.get('x-app-id') || 'ublx',
  };
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { workspaceId, appId } = scope(req);
  const panelRows = await db.select().from(panels)
    .where(eq(panels.workspace_id, workspaceId))
    .orderBy(asc(panels.position));

  const allComponents = panelRows.length > 0
    ? await db.select().from(panelComponents).orderBy(asc(panelComponents.position))
    : [];

  const componentsByPanel = new Map<string, typeof allComponents>();
  for (const c of allComponents) {
    const list = componentsByPanel.get(c.panel_id) ?? [];
    list.push(c);
    componentsByPanel.set(c.panel_id, list);
  }

  const result = panelRows.map((p) => ({
    ...p,
    app_id: p.app_id || appId,
    layout_grid: { rows: 24, cols: 32 },
    components: (componentsByPanel.get(p.panel_id) ?? []).map((c) => ({
      instance_id: c.instance_id,
      component_id: c.component_id,
      version: c.version,
      rect: { x: c.rect_x, y: c.rect_y, w: c.rect_w, h: c.rect_h },
      front_props: JSON.parse(c.front_props || '{}'),
    })),
  }));

  return NextResponse.json(result);
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const { workspaceId, appId } = scope(req);
  const body = await req.json().catch(() => null) as { name?: string } | null;
  const name = body?.name?.trim() || 'New Tab';

  const [created] = await db.insert(panels).values({
    panel_id: crypto.randomUUID(),
    workspace_id: workspaceId,
    app_id: appId,
    name,
    position: 0,
  }).returning();

  return NextResponse.json({
    ...created,
    layout_grid: { rows: 24, cols: 32 },
    components: [],
  }, { status: 201 });
}
