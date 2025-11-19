import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse and validate query parameters
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');

    // Query users sorted by points in descending order
    const leaderboardUsers = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        branch: users.branch,
        rollNumber: users.rollNumber,
        semester: users.semester,
        year: users.year,
        gender: users.gender,
        dob: users.dob,
        profilePicture: users.profilePicture,
        phoneNumber: users.phoneNumber,
        department: users.department,
        points: users.points,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(desc(users.points))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(leaderboardUsers, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        code: 'INTERNAL_SERVER_ERROR'
      },
      { status: 500 }
    );
  }
}