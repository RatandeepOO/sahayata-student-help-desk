import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { complaints } from '@/db/schema';
import { sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    // Use raw SQL query with COUNT and CASE statements for efficient aggregation
    const result = await db.select({
      total: sql<number>`count(*)`,
      open: sql<number>`count(case when ${complaints.status} = 'open' then 1 end)`,
      inProgress: sql<number>`count(case when ${complaints.status} = 'in-progress' then 1 end)`,
      resolved: sql<number>`count(case when ${complaints.status} = 'resolved' then 1 end)`,
      closed: sql<number>`count(case when ${complaints.status} = 'closed' then 1 end)`,
    }).from(complaints);

    // Extract the first (and only) row from the result
    const stats = result[0];

    // Return the statistics in the specified format
    return NextResponse.json({
      total: Number(stats.total),
      open: Number(stats.open),
      'in-progress': Number(stats.inProgress),
      resolved: Number(stats.resolved),
      closed: Number(stats.closed),
    }, { status: 200 });

  } catch (error) {
    console.error('GET statistics error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
      code: 'INTERNAL_SERVER_ERROR'
    }, { status: 500 });
  }
}