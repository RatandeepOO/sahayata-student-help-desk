import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { technicalTeam } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // Single member by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      const member = await db
        .select()
        .from(technicalTeam)
        .where(eq(technicalTeam.id, parseInt(id)))
        .limit(1);

      if (member.length === 0) {
        return NextResponse.json(
          { error: 'Technical team member not found', code: 'MEMBER_NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(member[0], { status: 200 });
    }

    // List with filters
    const department = searchParams.get('department');
    const available = searchParams.get('available');
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');

    let query = db.select().from(technicalTeam);

    // Build filter conditions
    const conditions = [];

    if (department) {
      conditions.push(eq(technicalTeam.department, department));
    }

    if (available !== null && available !== undefined) {
      const isAvailable = available === 'true';
      conditions.push(eq(technicalTeam.available, isAvailable));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const members = await query.limit(limit).offset(offset);

    return NextResponse.json(members, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, name, department, email, phoneNumber, available } = body;

    // Validate required fields
    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required', code: 'MISSING_USER_ID' },
        { status: 400 }
      );
    }

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        { error: 'name is required and must be a non-empty string', code: 'INVALID_NAME' },
        { status: 400 }
      );
    }

    if (!department || typeof department !== 'string' || !department.trim()) {
      return NextResponse.json(
        { error: 'department is required and must be a non-empty string', code: 'INVALID_DEPARTMENT' },
        { status: 400 }
      );
    }

    if (!email || typeof email !== 'string' || !email.trim()) {
      return NextResponse.json(
        { error: 'email is required and must be a non-empty string', code: 'INVALID_EMAIL' },
        { status: 400 }
      );
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json(
        { error: 'Invalid email format', code: 'INVALID_EMAIL_FORMAT' },
        { status: 400 }
      );
    }

    if (!phoneNumber || typeof phoneNumber !== 'string' || !phoneNumber.trim()) {
      return NextResponse.json(
        { error: 'phoneNumber is required and must be a non-empty string', code: 'INVALID_PHONE_NUMBER' },
        { status: 400 }
      );
    }

    // Validate userId is integer
    if (typeof userId !== 'number' || !Number.isInteger(userId)) {
      return NextResponse.json(
        { error: 'userId must be a valid integer', code: 'INVALID_USER_ID_TYPE' },
        { status: 400 }
      );
    }

    // Validate available if provided
    if (available !== undefined && typeof available !== 'boolean') {
      return NextResponse.json(
        { error: 'available must be a boolean', code: 'INVALID_AVAILABLE_TYPE' },
        { status: 400 }
      );
    }

    // Prepare insert data
    const insertData = {
      userId: userId,
      name: name.trim(),
      department: department.trim(),
      email: email.trim().toLowerCase(),
      phoneNumber: phoneNumber.trim(),
      available: available !== undefined ? available : true,
      createdAt: new Date().toISOString(),
    };

    const newMember = await db
      .insert(technicalTeam)
      .values(insertData)
      .returning();

    return NextResponse.json(newMember[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check if member exists
    const existingMember = await db
      .select()
      .from(technicalTeam)
      .where(eq(technicalTeam.id, parseInt(id)))
      .limit(1);

    if (existingMember.length === 0) {
      return NextResponse.json(
        { error: 'Technical team member not found', code: 'MEMBER_NOT_FOUND' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { userId, name, department, email, phoneNumber, available } = body;

    // Build update object with only provided fields
    const updates: any = {};

    if (userId !== undefined) {
      if (typeof userId !== 'number' || !Number.isInteger(userId)) {
        return NextResponse.json(
          { error: 'userId must be a valid integer', code: 'INVALID_USER_ID_TYPE' },
          { status: 400 }
        );
      }
      updates.userId = userId;
    }

    if (name !== undefined) {
      if (typeof name !== 'string' || !name.trim()) {
        return NextResponse.json(
          { error: 'name must be a non-empty string', code: 'INVALID_NAME' },
          { status: 400 }
        );
      }
      updates.name = name.trim();
    }

    if (department !== undefined) {
      if (typeof department !== 'string' || !department.trim()) {
        return NextResponse.json(
          { error: 'department must be a non-empty string', code: 'INVALID_DEPARTMENT' },
          { status: 400 }
        );
      }
      updates.department = department.trim();
    }

    if (email !== undefined) {
      if (typeof email !== 'string' || !email.trim()) {
        return NextResponse.json(
          { error: 'email must be a non-empty string', code: 'INVALID_EMAIL' },
          { status: 400 }
        );
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        return NextResponse.json(
          { error: 'Invalid email format', code: 'INVALID_EMAIL_FORMAT' },
          { status: 400 }
        );
      }
      updates.email = email.trim().toLowerCase();
    }

    if (phoneNumber !== undefined) {
      if (typeof phoneNumber !== 'string' || !phoneNumber.trim()) {
        return NextResponse.json(
          { error: 'phoneNumber must be a non-empty string', code: 'INVALID_PHONE_NUMBER' },
          { status: 400 }
        );
      }
      updates.phoneNumber = phoneNumber.trim();
    }

    if (available !== undefined) {
      if (typeof available !== 'boolean') {
        return NextResponse.json(
          { error: 'available must be a boolean', code: 'INVALID_AVAILABLE_TYPE' },
          { status: 400 }
        );
      }
      updates.available = available;
    }

    // Check if there are any fields to update
    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields provided for update', code: 'NO_UPDATE_FIELDS' },
        { status: 400 }
      );
    }

    const updatedMember = await db
      .update(technicalTeam)
      .set(updates)
      .where(eq(technicalTeam.id, parseInt(id)))
      .returning();

    return NextResponse.json(updatedMember[0], { status: 200 });
  } catch (error) {
    console.error('PATCH error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check if member exists
    const existingMember = await db
      .select()
      .from(technicalTeam)
      .where(eq(technicalTeam.id, parseInt(id)))
      .limit(1);

    if (existingMember.length === 0) {
      return NextResponse.json(
        { error: 'Technical team member not found', code: 'MEMBER_NOT_FOUND' },
        { status: 404 }
      );
    }

    const deleted = await db
      .delete(technicalTeam)
      .where(eq(technicalTeam.id, parseInt(id)))
      .returning();

    return NextResponse.json(
      {
        message: 'Technical team member deleted successfully',
        deleted: deleted[0],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}