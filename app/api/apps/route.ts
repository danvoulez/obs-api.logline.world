import { NextResponse } from 'next/server';
import { db } from '@/db';
import { apps } from '@/db/schema';

export async function GET(): Promise<NextResponse> {
  const rows = await db.select().from(apps);
  return NextResponse.json(rows);
}
