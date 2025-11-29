import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validate required fields
    if (!email || typeof email !== 'string' || email.trim() === '') {
      return NextResponse.json(
        { 
          error: 'Email is required',
          code: 'MISSING_CREDENTIALS'
        },
        { status: 400 }
      );
    }

    if (!password || typeof password !== 'string' || password.trim() === '') {
      return NextResponse.json(
        { 
          error: 'Password is required',
          code: 'MISSING_CREDENTIALS'
        },
        { status: 400 }
      );
    }

    // Find user by email (case-insensitive)
    const user = await db
      .select()
      .from(users)
      .where(sql`lower(${users.email}) = lower(${email.trim()})`)
      .limit(1);

    // Check if user exists
    if (user.length === 0) {
      return NextResponse.json(
        { 
          error: 'Invalid email or password',
          code: 'INVALID_CREDENTIALS'
        },
        { status: 401 }
      );
    }

    const foundUser = user[0];

    // Compare plain text password
    if (foundUser.password !== password) {
      return NextResponse.json(
        { 
          error: 'Invalid email or password',
          code: 'INVALID_CREDENTIALS'
        },
        { status: 401 }
      );
    }

    // Remove password from response
    const { password: _, ...userWithoutPassword } = foundUser;

    // Return user data without password
    return NextResponse.json(userWithoutPassword, { status: 200 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
      },
      { status: 500 }
    );
  }
}