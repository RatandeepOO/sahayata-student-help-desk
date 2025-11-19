import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient();
    const { id } = params;

    const { data, error } = await supabase
      .from('complaints')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json({ complaint: data }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient();
    const { id } = params;
    const updates = await req.json();

    const { data, error } = await supabase
      .from('complaints')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // If complaint is resolved, create notification and update volunteer points
    if (updates.status === 'resolved' && data.volunteer_id) {
      const pointsMap: Record<string, number> = {
        easy: 10,
        medium: 25,
        hard: 50,
      };
      const points = pointsMap[data.difficulty] || 10;

      // Update volunteer points
      await supabase.rpc('increment_user_points', { 
        user_id: data.volunteer_id, 
        points_to_add: points 
      });

      // Create notification
      await supabase.from('notifications').insert([
        {
          user_id: data.raised_by,
          type: 'complaint_resolved',
          message: `Your complaint "${data.title}" has been resolved by ${data.volunteer_name}`,
          complaint_id: id,
          read: false,
        },
      ]);
    }

    return NextResponse.json({ complaint: data }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient();
    const { id } = params;

    const { error } = await supabase
      .from('complaints')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
