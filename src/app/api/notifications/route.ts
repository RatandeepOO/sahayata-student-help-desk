import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { notifications } from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';

const VALID_TYPES = ['complaint_resolved', 'new_message', 'complaint_accepted'];

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const userId = searchParams.get('user_id');
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');

    // Single notification by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json({ 
          error: "Valid ID is required",
          code: "INVALID_ID" 
        }, { status: 400 });
      }

      const notification = await db.select()
        .from(notifications)
        .where(eq(notifications.id, parseInt(id)))
        .limit(1);

      if (notification.length === 0) {
        return NextResponse.json({ 
          error: 'Notification not found',
          code: 'NOT_FOUND' 
        }, { status: 404 });
      }

      return NextResponse.json(notification[0]);
    }

    // List notifications with optional filters
    let query = db.select().from(notifications);

    if (userId) {
      if (isNaN(parseInt(userId))) {
        return NextResponse.json({ 
          error: "Valid user ID is required",
          code: "INVALID_USER_ID" 
        }, { status: 400 });
      }
      query = query.where(eq(notifications.userId, parseInt(userId)));
    }

    const results = await query
      .orderBy(desc(notifications.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(results);
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, type, message, complaintId } = body;

    // Validate required fields
    if (!userId) {
      return NextResponse.json({ 
        error: "userId is required",
        code: "MISSING_USER_ID" 
      }, { status: 400 });
    }

    if (isNaN(parseInt(userId))) {
      return NextResponse.json({ 
        error: "Valid userId is required",
        code: "INVALID_USER_ID" 
      }, { status: 400 });
    }

    if (!type) {
      return NextResponse.json({ 
        error: "type is required",
        code: "MISSING_TYPE" 
      }, { status: 400 });
    }

    if (!VALID_TYPES.includes(type)) {
      return NextResponse.json({ 
        error: `type must be one of: ${VALID_TYPES.join(', ')}`,
        code: "INVALID_TYPE" 
      }, { status: 400 });
    }

    if (!message) {
      return NextResponse.json({ 
        error: "message is required",
        code: "MISSING_MESSAGE" 
      }, { status: 400 });
    }

    const trimmedMessage = message.trim();
    if (!trimmedMessage) {
      return NextResponse.json({ 
        error: "message cannot be empty",
        code: "EMPTY_MESSAGE" 
      }, { status: 400 });
    }

    // Validate complaintId if provided
    if (complaintId !== undefined && complaintId !== null && isNaN(parseInt(complaintId))) {
      return NextResponse.json({ 
        error: "Valid complaintId is required",
        code: "INVALID_COMPLAINT_ID" 
      }, { status: 400 });
    }

    const insertData: any = {
      userId: parseInt(userId),
      type,
      message: trimmedMessage,
      read: false,
      createdAt: new Date().toISOString(),
    };

    if (complaintId !== undefined && complaintId !== null) {
      insertData.complaintId = parseInt(complaintId);
    }

    const newNotification = await db.insert(notifications)
      .values(insertData)
      .returning();

    return NextResponse.json(newNotification[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
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

    // Check if notification exists
    const existing = await db.select()
      .from(notifications)
      .where(eq(notifications.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ 
        error: 'Notification not found',
        code: 'NOT_FOUND' 
      }, { status: 404 });
    }

    // Update notification to mark as read
    const updated = await db.update(notifications)
      .set({
        read: true,
      })
      .where(eq(notifications.id, parseInt(id)))
      .returning();

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error('PATCH error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
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

    // Check if notification exists
    const existing = await db.select()
      .from(notifications)
      .where(eq(notifications.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ 
        error: 'Notification not found',
        code: 'NOT_FOUND' 
      }, { status: 404 });
    }

    const deleted = await db.delete(notifications)
      .where(eq(notifications.id, parseInt(id)))
      .returning();

    return NextResponse.json({ 
      message: 'Notification deleted successfully',
      deleted: deleted[0]
    });
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}