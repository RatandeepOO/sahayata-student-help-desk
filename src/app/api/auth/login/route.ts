import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';

// Admin credentials (hardcoded)
const ADMIN_CREDENTIALS = [
  { email: 'cse@sahayata.com', password: 'CSEADMIN', department: 'CSE', name: 'CSE Admin' },
  { email: 'elex@sahayata.com', password: 'ELEXADMIN', department: 'Electronics', name: 'Electronics Admin' },
  { email: 'pharma@sahayata.com', password: 'PHARMAADMIN', department: 'Pharmacy', name: 'Pharmacy Admin' },
  { email: 'mech@sahayata.com', password: 'MECHADMIN', department: 'Mechanical', name: 'Mechanical Admin' },
  { email: 'elec@sahayata.com', password: 'ELECADMIN', department: 'Electrical', name: 'Electrical Admin' },
];

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

    // Check if this is an admin credential
    const adminCred = ADMIN_CREDENTIALS.find(
      admin => admin.email.toLowerCase() === email.trim().toLowerCase() && admin.password === password
    );

    if (adminCred) {
      // Check if admin user exists in database
      let adminUser = await db
        .select()
        .from(users)
        .where(sql`lower(${users.email}) = lower(${adminCred.email})`)
        .limit(1);

      // If admin doesn't exist in database, create them
      if (adminUser.length === 0) {
        const newAdmin = await db.insert(users)
          .values({
            email: adminCred.email,
            password: adminCred.password,
            role: 'admin',
            name: adminCred.name,
            department: adminCred.department,
            profilePicture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
            points: 0,
            createdAt: new Date().toISOString()
          })
          .returning();
        
        adminUser = newAdmin;
      }

      // Remove password from response
      const { password: _, ...userWithoutPassword } = adminUser[0];
      return NextResponse.json(userWithoutPassword, { status: 200 });
    }

    // Find regular user by email (case-insensitive)
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