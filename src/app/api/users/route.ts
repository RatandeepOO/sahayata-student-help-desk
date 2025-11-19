import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq, and, or } from 'drizzle-orm';

const VALID_ROLES = ['student', 'technical', 'admin'];
const VALID_GENDERS = ['male', 'female', 'other'];

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const role = searchParams.get('role');
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');

    // Single user by ID
    if (id) {
      if (isNaN(parseInt(id))) {
        return NextResponse.json({ 
          error: "Valid ID is required",
          code: "INVALID_ID" 
        }, { status: 400 });
      }

      const user = await db.select()
        .from(users)
        .where(eq(users.id, parseInt(id)))
        .limit(1);

      if (user.length === 0) {
        return NextResponse.json({ 
          error: 'User not found',
          code: "USER_NOT_FOUND" 
        }, { status: 404 });
      }

      // Remove password from response
      const { password, ...userWithoutPassword } = user[0];
      return NextResponse.json(userWithoutPassword, { status: 200 });
    }

    // List users with optional role filter
    let query = db.select().from(users);

    if (role) {
      if (!VALID_ROLES.includes(role)) {
        return NextResponse.json({ 
          error: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}`,
          code: "INVALID_ROLE" 
        }, { status: 400 });
      }
      query = query.where(eq(users.role, role));
    }

    const results = await query.limit(limit).offset(offset);

    // Remove passwords from all results
    const usersWithoutPasswords = results.map(({ password, ...user }) => user);

    return NextResponse.json(usersWithoutPasswords, { status: 200 });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      email,
      password,
      role,
      name,
      branch,
      rollNumber,
      semester,
      year,
      gender,
      dob,
      profilePicture,
      phoneNumber,
      department,
      points
    } = body;

    // Validate required fields
    if (!email || typeof email !== 'string' || !email.trim()) {
      return NextResponse.json({ 
        error: "Email is required",
        code: "MISSING_EMAIL" 
      }, { status: 400 });
    }

    if (!password || typeof password !== 'string') {
      return NextResponse.json({ 
        error: "Password is required",
        code: "MISSING_PASSWORD" 
      }, { status: 400 });
    }

    if (!role || typeof role !== 'string') {
      return NextResponse.json({ 
        error: "Role is required",
        code: "MISSING_ROLE" 
      }, { status: 400 });
    }

    if (!VALID_ROLES.includes(role)) {
      return NextResponse.json({ 
        error: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}`,
        code: "INVALID_ROLE" 
      }, { status: 400 });
    }

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ 
        error: "Name is required",
        code: "MISSING_NAME" 
      }, { status: 400 });
    }

    // Validate gender if provided
    if (gender && !VALID_GENDERS.includes(gender)) {
      return NextResponse.json({ 
        error: `Invalid gender. Must be one of: ${VALID_GENDERS.join(', ')}`,
        code: "INVALID_GENDER" 
      }, { status: 400 });
    }

    // Validate points if provided
    if (points !== undefined && (typeof points !== 'number' || !Number.isInteger(points))) {
      return NextResponse.json({ 
        error: "Points must be an integer",
        code: "INVALID_POINTS" 
      }, { status: 400 });
    }

    // Check if email already exists
    const existingUser = await db.select()
      .from(users)
      .where(eq(users.email, email.trim().toLowerCase()))
      .limit(1);

    if (existingUser.length > 0) {
      return NextResponse.json({ 
        error: "Email already exists",
        code: "EMAIL_EXISTS" 
      }, { status: 400 });
    }

    // Prepare insert data
    const insertData: any = {
      email: email.trim().toLowerCase(),
      password: password,
      role: role,
      name: name.trim(),
      points: points ?? 0,
      createdAt: new Date().toISOString()
    };

    // Add optional fields if provided
    if (branch) insertData.branch = branch.trim();
    if (rollNumber) insertData.rollNumber = rollNumber.trim();
    if (semester) insertData.semester = semester.trim();
    if (year) insertData.year = year.trim();
    if (gender) insertData.gender = gender;
    if (dob) insertData.dob = dob;
    if (profilePicture) insertData.profilePicture = profilePicture.trim();
    if (phoneNumber) insertData.phoneNumber = phoneNumber.trim();
    if (department) insertData.department = department.trim();

    const newUser = await db.insert(users)
      .values(insertData)
      .returning();

    // Remove password from response
    const { password: _, ...userWithoutPassword } = newUser[0];
    
    return NextResponse.json(userWithoutPassword, { status: 201 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    const body = await request.json();
    const {
      email,
      password,
      role,
      name,
      branch,
      rollNumber,
      semester,
      year,
      gender,
      dob,
      profilePicture,
      phoneNumber,
      department,
      points
    } = body;

    // Check if user exists
    const existingUser = await db.select()
      .from(users)
      .where(eq(users.id, parseInt(id)))
      .limit(1);

    if (existingUser.length === 0) {
      return NextResponse.json({ 
        error: 'User not found',
        code: "USER_NOT_FOUND" 
      }, { status: 404 });
    }

    // Validate role if provided
    if (role && !VALID_ROLES.includes(role)) {
      return NextResponse.json({ 
        error: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}`,
        code: "INVALID_ROLE" 
      }, { status: 400 });
    }

    // Validate gender if provided
    if (gender && !VALID_GENDERS.includes(gender)) {
      return NextResponse.json({ 
        error: `Invalid gender. Must be one of: ${VALID_GENDERS.join(', ')}`,
        code: "INVALID_GENDER" 
      }, { status: 400 });
    }

    // Validate points if provided
    if (points !== undefined && (typeof points !== 'number' || !Number.isInteger(points))) {
      return NextResponse.json({ 
        error: "Points must be an integer",
        code: "INVALID_POINTS" 
      }, { status: 400 });
    }

    // Check if email is being changed and if new email already exists
    if (email && email.trim().toLowerCase() !== existingUser[0].email) {
      const emailExists = await db.select()
        .from(users)
        .where(eq(users.email, email.trim().toLowerCase()))
        .limit(1);

      if (emailExists.length > 0) {
        return NextResponse.json({ 
          error: "Email already exists",
          code: "EMAIL_EXISTS" 
        }, { status: 400 });
      }
    }

    // Prepare update data
    const updateData: any = {};

    if (email) updateData.email = email.trim().toLowerCase();
    if (password) updateData.password = password;
    if (role) updateData.role = role;
    if (name) updateData.name = name.trim();
    if (branch !== undefined) updateData.branch = branch ? branch.trim() : null;
    if (rollNumber !== undefined) updateData.rollNumber = rollNumber ? rollNumber.trim() : null;
    if (semester !== undefined) updateData.semester = semester ? semester.trim() : null;
    if (year !== undefined) updateData.year = year ? year.trim() : null;
    if (gender !== undefined) updateData.gender = gender;
    if (dob !== undefined) updateData.dob = dob;
    if (profilePicture !== undefined) updateData.profilePicture = profilePicture ? profilePicture.trim() : null;
    if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber ? phoneNumber.trim() : null;
    if (department !== undefined) updateData.department = department ? department.trim() : null;
    if (points !== undefined) updateData.points = points;

    // If no fields to update
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ 
        error: "No fields to update",
        code: "NO_UPDATE_FIELDS" 
      }, { status: 400 });
    }

    const updated = await db.update(users)
      .set(updateData)
      .where(eq(users.id, parseInt(id)))
      .returning();

    // Remove password from response
    const { password: _, ...userWithoutPassword } = updated[0];
    
    return NextResponse.json(userWithoutPassword, { status: 200 });

  } catch (error) {
    console.error('PATCH error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    // Check if user exists
    const existingUser = await db.select()
      .from(users)
      .where(eq(users.id, parseInt(id)))
      .limit(1);

    if (existingUser.length === 0) {
      return NextResponse.json({ 
        error: 'User not found',
        code: "USER_NOT_FOUND" 
      }, { status: 404 });
    }

    const deleted = await db.delete(users)
      .where(eq(users.id, parseInt(id)))
      .returning();

    // Remove password from response
    const { password, ...userWithoutPassword } = deleted[0];

    return NextResponse.json({ 
      message: 'User deleted successfully',
      user: userWithoutPassword
    }, { status: 200 });

  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}