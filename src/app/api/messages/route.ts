import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const complaintId = searchParams.get('complaintId');

    let query = supabase.from('messages').select('*').order('created_at', { ascending: true });

    if (userId) {
      query = query.or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);
    }

    if (complaintId) {
      query = query.eq('complaint_id', complaintId);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ messages: data }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const body = await req.json();

    const { data, error } = await supabase
      .from('messages')
      .insert([body])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Create notification for receiver
    await supabase.from('notifications').insert([
      {
        user_id: body.receiver_id,
        type: 'new_message',
        message: `New message from ${body.sender_name}`,
        complaint_id: body.complaint_id,
        read: false,
      },
    ]);

    return NextResponse.json({ message: data }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
