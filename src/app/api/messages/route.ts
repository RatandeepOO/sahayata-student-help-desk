import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { messages } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const senderId = searchParams.get('sender_id');
    const receiverId = searchParams.get('receiver_id');
    const complaintId = searchParams.get('complaint_id');
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '100'), 200);
    const offset = parseInt(searchParams.get('offset') ?? '0');

    // Single message by ID
    if (id) {
      if (isNaN(parseInt(id))) {
        return NextResponse.json({
          error: 'Valid ID is required',
          code: 'INVALID_ID'
        }, { status: 400 });
      }

      const message = await db.select()
        .from(messages)
        .where(eq(messages.id, parseInt(id)))
        .limit(1);

      if (message.length === 0) {
        return NextResponse.json({
          error: 'Message not found',
          code: 'MESSAGE_NOT_FOUND'
        }, { status: 404 });
      }

      return NextResponse.json(message[0], { status: 200 });
    }

    // List messages with filters
    const conditions = [];

    if (senderId) {
      if (isNaN(parseInt(senderId))) {
        return NextResponse.json({
          error: 'Valid sender ID is required',
          code: 'INVALID_SENDER_ID'
        }, { status: 400 });
      }
      conditions.push(eq(messages.senderId, parseInt(senderId)));
    }

    if (receiverId) {
      if (isNaN(parseInt(receiverId))) {
        return NextResponse.json({
          error: 'Valid receiver ID is required',
          code: 'INVALID_RECEIVER_ID'
        }, { status: 400 });
      }
      conditions.push(eq(messages.receiverId, parseInt(receiverId)));
    }

    if (complaintId) {
      if (isNaN(parseInt(complaintId))) {
        return NextResponse.json({
          error: 'Valid complaint ID is required',
          code: 'INVALID_COMPLAINT_ID'
        }, { status: 400 });
      }
      conditions.push(eq(messages.complaintId, parseInt(complaintId)));
    }

    let query = db.select().from(messages);

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query
      .orderBy(desc(messages.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(results, { status: 200 });

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
    const { senderId, senderName, receiverId, content, complaintId } = body;

    // Validate required fields
    if (!senderId) {
      return NextResponse.json({
        error: 'Sender ID is required',
        code: 'MISSING_SENDER_ID'
      }, { status: 400 });
    }

    if (!senderName || typeof senderName !== 'string' || senderName.trim() === '') {
      return NextResponse.json({
        error: 'Sender name is required',
        code: 'MISSING_SENDER_NAME'
      }, { status: 400 });
    }

    if (!receiverId) {
      return NextResponse.json({
        error: 'Receiver ID is required',
        code: 'MISSING_RECEIVER_ID'
      }, { status: 400 });
    }

    if (!content || typeof content !== 'string' || content.trim() === '') {
      return NextResponse.json({
        error: 'Content is required',
        code: 'MISSING_CONTENT'
      }, { status: 400 });
    }

    // Validate senderId and receiverId are valid integers
    if (isNaN(parseInt(senderId))) {
      return NextResponse.json({
        error: 'Sender ID must be a valid integer',
        code: 'INVALID_SENDER_ID'
      }, { status: 400 });
    }

    if (isNaN(parseInt(receiverId))) {
      return NextResponse.json({
        error: 'Receiver ID must be a valid integer',
        code: 'INVALID_RECEIVER_ID'
      }, { status: 400 });
    }

    // Validate complaintId if provided
    if (complaintId !== undefined && complaintId !== null && isNaN(parseInt(complaintId))) {
      return NextResponse.json({
        error: 'Complaint ID must be a valid integer',
        code: 'INVALID_COMPLAINT_ID'
      }, { status: 400 });
    }

    // Prepare insert data
    const insertData: any = {
      senderId: parseInt(senderId),
      senderName: senderName.trim(),
      receiverId: parseInt(receiverId),
      content: content.trim(),
      read: false,
      createdAt: new Date().toISOString()
    };

    // Add complaintId only if provided
    if (complaintId !== undefined && complaintId !== null) {
      insertData.complaintId = parseInt(complaintId);
    }

    const newMessage = await db.insert(messages)
      .values(insertData)
      .returning();

    return NextResponse.json(newMessage[0], { status: 201 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + (error as Error).message
    }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Validate ID parameter
    if (!id) {
      return NextResponse.json({
        error: 'Message ID is required',
        code: 'MISSING_ID'
      }, { status: 400 });
    }

    if (isNaN(parseInt(id))) {
      return NextResponse.json({
        error: 'Valid ID is required',
        code: 'INVALID_ID'
      }, { status: 400 });
    }

    // Check if message exists
    const existingMessage = await db.select()
      .from(messages)
      .where(eq(messages.id, parseInt(id)))
      .limit(1);

    if (existingMessage.length === 0) {
      return NextResponse.json({
        error: 'Message not found',
        code: 'MESSAGE_NOT_FOUND'
      }, { status: 404 });
    }

    // Update read status
    const updatedMessage = await db.update(messages)
      .set({
        read: true
      })
      .where(eq(messages.id, parseInt(id)))
      .returning();

    return NextResponse.json(updatedMessage[0], { status: 200 });

  } catch (error) {
    console.error('PATCH error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + (error as Error).message
    }, { status: 500 });
  }
}