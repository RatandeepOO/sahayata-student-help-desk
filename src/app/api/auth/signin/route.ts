import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// Admin credentials
const ADMIN_CREDENTIALS = [
  { email: 'cse@sahayata.com', password: 'CSEADMIN', department: 'CSE' },
  { email: 'elex@sahayata.com', password: 'ELEXADMIN', department: 'Electronics' },
  { email: 'pharma@sahayata.com', password: 'PHARMAADMIN', department: 'Pharmacy' },
  { email: 'mech@sahayata.com', password: 'MECHADMIN', department: 'Mechanical' },
  { email: 'elec@sahayata.com', password: 'ELECADMIN', department: 'Electrical' },
];

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    const supabase = await createClient();

    // Check if admin credentials
    const adminCred = ADMIN_CREDENTIALS.find(
      (admin) => admin.email === email && admin.password === password
    );

    if (adminCred) {
      // Create a temporary admin session (no actual Supabase auth)
      const adminUser = {
        id: `admin-${adminCred.department}`,
        email: adminCred.email,
        role: 'admin',
        name: 'Admin',
        branch: adminCred.department,
        points: 0,
      };
      return NextResponse.json({ user: adminUser, isAdmin: true }, { status: 200 });
    }

    // Regular user sign in
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    if (!authData.user) {
      return NextResponse.json({ error: 'Failed to sign in' }, { status: 401 });
    }

    // Get user profile
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('auth_user_id', authData.user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    return NextResponse.json({ user: userData, isAdmin: false }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
