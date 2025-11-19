import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { generateAvatar } from '@/lib/avatar';

export async function POST(req: Request) {
  try {
    const body = await req.json();
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
      phoneNumber,
      department,
    } = body;

    const supabase = await createClient();

    // Sign up with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    if (!authData.user) {
      return NextResponse.json({ error: 'Failed to create user' }, { status: 400 });
    }

    // Create user profile
    const profilePicture = generateAvatar(gender || 'male', email);
    
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert([
        {
          auth_user_id: authData.user.id,
          email,
          role,
          name,
          branch,
          roll_number: rollNumber,
          semester,
          year,
          gender,
          dob,
          profile_picture: profilePicture,
          phone_number: phoneNumber,
          department,
          points: 0,
        },
      ])
      .select()
      .single();

    if (userError) {
      // Clean up auth user if profile creation fails
      await supabase.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json({ error: userError.message }, { status: 400 });
    }

    // If technical team member, add to technical_team table
    if (role === 'technical' && department) {
      await supabase.from('technical_team').insert([
        {
          id: userData.id,
          name,
          department,
          email,
          phone_number: phoneNumber,
          available: true,
        },
      ]);
    }

    return NextResponse.json({ user: userData }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
