import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { complaints } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

const VALID_CATEGORIES = ['electrical', 'mechanical', 'networking', 'plumbing', 'civil', 'other'];
const VALID_DIFFICULTIES = ['easy', 'medium', 'hard'];
const VALID_STATUSES = ['open', 'in-progress', 'resolved', 'closed'];

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json({ 
          error: "Valid ID is required",
          code: "INVALID_ID" 
        }, { status: 400 });
      }

      const complaint = await db.select()
        .from(complaints)
        .where(eq(complaints.id, parseInt(id)))
        .limit(1);

      if (complaint.length === 0) {
        return NextResponse.json({ 
          error: 'Complaint not found',
          code: 'NOT_FOUND' 
        }, { status: 404 });
      }

      return NextResponse.json(complaint[0], { status: 200 });
    }

    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const raisedBy = searchParams.get('raised_by');
    const volunteerId = searchParams.get('volunteer_id');

    const conditions = [];

    if (status) {
      if (!VALID_STATUSES.includes(status)) {
        return NextResponse.json({ 
          error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
          code: "INVALID_STATUS" 
        }, { status: 400 });
      }
      conditions.push(eq(complaints.status, status));
    }

    if (category) {
      if (!VALID_CATEGORIES.includes(category)) {
        return NextResponse.json({ 
          error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}`,
          code: "INVALID_CATEGORY" 
        }, { status: 400 });
      }
      conditions.push(eq(complaints.category, category));
    }

    if (raisedBy) {
      const raisedById = parseInt(raisedBy);
      if (isNaN(raisedById)) {
        return NextResponse.json({ 
          error: "Valid raised_by ID is required",
          code: "INVALID_RAISED_BY" 
        }, { status: 400 });
      }
      conditions.push(eq(complaints.raisedBy, raisedById));
    }

    if (volunteerId) {
      const volId = parseInt(volunteerId);
      if (isNaN(volId)) {
        return NextResponse.json({ 
          error: "Valid volunteer_id is required",
          code: "INVALID_VOLUNTEER_ID" 
        }, { status: 400 });
      }
      conditions.push(eq(complaints.volunteerId, volId));
    }

    let query = db.select().from(complaints);

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query.limit(limit).offset(offset);

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
    const { 
      title, 
      description, 
      category, 
      difficulty, 
      emergency, 
      fixTillDate,
      photo,
      raisedBy,
      raisedByName,
      raisedByBranch,
      raisedByProfilePic,
      volunteerId,
      volunteerName
    } = body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json({ 
        error: "Title is required and must be a non-empty string",
        code: "MISSING_TITLE" 
      }, { status: 400 });
    }

    if (!description || typeof description !== 'string' || description.trim().length === 0) {
      return NextResponse.json({ 
        error: "Description is required and must be a non-empty string",
        code: "MISSING_DESCRIPTION" 
      }, { status: 400 });
    }

    if (!category || !VALID_CATEGORIES.includes(category)) {
      return NextResponse.json({ 
        error: `Category is required and must be one of: ${VALID_CATEGORIES.join(', ')}`,
        code: "INVALID_CATEGORY" 
      }, { status: 400 });
    }

    if (!difficulty || !VALID_DIFFICULTIES.includes(difficulty)) {
      return NextResponse.json({ 
        error: `Difficulty is required and must be one of: ${VALID_DIFFICULTIES.join(', ')}`,
        code: "INVALID_DIFFICULTY" 
      }, { status: 400 });
    }

    if (typeof emergency !== 'boolean') {
      return NextResponse.json({ 
        error: "Emergency is required and must be a boolean",
        code: "INVALID_EMERGENCY" 
      }, { status: 400 });
    }

    if (!fixTillDate || typeof fixTillDate !== 'string' || fixTillDate.trim().length === 0) {
      return NextResponse.json({ 
        error: "fixTillDate is required and must be a non-empty string",
        code: "MISSING_FIX_TILL_DATE" 
      }, { status: 400 });
    }

    if (!raisedBy || typeof raisedBy !== 'number') {
      return NextResponse.json({ 
        error: "raisedBy is required and must be a number",
        code: "MISSING_RAISED_BY" 
      }, { status: 400 });
    }

    if (!raisedByName || typeof raisedByName !== 'string' || raisedByName.trim().length === 0) {
      return NextResponse.json({ 
        error: "raisedByName is required and must be a non-empty string",
        code: "MISSING_RAISED_BY_NAME" 
      }, { status: 400 });
    }

    const insertData: any = {
      title: title.trim(),
      description: description.trim(),
      category,
      difficulty,
      emergency,
      fixTillDate: fixTillDate.trim(),
      raisedBy,
      raisedByName: raisedByName.trim(),
      status: 'open',
      createdAt: new Date().toISOString()
    };

    if (photo) {
      insertData.photo = photo;
    }

    if (raisedByBranch) {
      insertData.raisedByBranch = raisedByBranch;
    }

    if (raisedByProfilePic) {
      insertData.raisedByProfilePic = raisedByProfilePic;
    }

    if (volunteerId) {
      insertData.volunteerId = volunteerId;
    }

    if (volunteerName) {
      insertData.volunteerName = volunteerName;
    }

    const newComplaint = await db.insert(complaints)
      .values(insertData)
      .returning();

    return NextResponse.json(newComplaint[0], { status: 201 });
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

    const complaintId = parseInt(id);

    const existingComplaint = await db.select()
      .from(complaints)
      .where(eq(complaints.id, complaintId))
      .limit(1);

    if (existingComplaint.length === 0) {
      return NextResponse.json({ 
        error: 'Complaint not found',
        code: 'NOT_FOUND' 
      }, { status: 404 });
    }

    const body = await request.json();
    const updates: any = {};

    if (body.title !== undefined) {
      if (typeof body.title !== 'string' || body.title.trim().length === 0) {
        return NextResponse.json({ 
          error: "Title must be a non-empty string",
          code: "INVALID_TITLE" 
        }, { status: 400 });
      }
      updates.title = body.title.trim();
    }

    if (body.description !== undefined) {
      if (typeof body.description !== 'string' || body.description.trim().length === 0) {
        return NextResponse.json({ 
          error: "Description must be a non-empty string",
          code: "INVALID_DESCRIPTION" 
        }, { status: 400 });
      }
      updates.description = body.description.trim();
    }

    if (body.category !== undefined) {
      if (!VALID_CATEGORIES.includes(body.category)) {
        return NextResponse.json({ 
          error: `Category must be one of: ${VALID_CATEGORIES.join(', ')}`,
          code: "INVALID_CATEGORY" 
        }, { status: 400 });
      }
      updates.category = body.category;
    }

    if (body.difficulty !== undefined) {
      if (!VALID_DIFFICULTIES.includes(body.difficulty)) {
        return NextResponse.json({ 
          error: `Difficulty must be one of: ${VALID_DIFFICULTIES.join(', ')}`,
          code: "INVALID_DIFFICULTY" 
        }, { status: 400 });
      }
      updates.difficulty = body.difficulty;
    }

    if (body.emergency !== undefined) {
      if (typeof body.emergency !== 'boolean') {
        return NextResponse.json({ 
          error: "Emergency must be a boolean",
          code: "INVALID_EMERGENCY" 
        }, { status: 400 });
      }
      updates.emergency = body.emergency;
    }

    if (body.fixTillDate !== undefined) {
      if (typeof body.fixTillDate !== 'string' || body.fixTillDate.trim().length === 0) {
        return NextResponse.json({ 
          error: "fixTillDate must be a non-empty string",
          code: "INVALID_FIX_TILL_DATE" 
        }, { status: 400 });
      }
      updates.fixTillDate = body.fixTillDate.trim();
    }

    if (body.status !== undefined) {
      if (!VALID_STATUSES.includes(body.status)) {
        return NextResponse.json({ 
          error: `Status must be one of: ${VALID_STATUSES.join(', ')}`,
          code: "INVALID_STATUS" 
        }, { status: 400 });
      }
      updates.status = body.status;
      
      if ((body.status === 'resolved' || body.status === 'closed') && !existingComplaint[0].resolvedAt) {
        updates.resolvedAt = new Date().toISOString();
      }
    }

    if (body.photo !== undefined) {
      updates.photo = body.photo;
    }

    if (body.raisedBy !== undefined) {
      updates.raisedBy = body.raisedBy;
    }

    if (body.raisedByName !== undefined) {
      updates.raisedByName = body.raisedByName;
    }

    if (body.raisedByBranch !== undefined) {
      updates.raisedByBranch = body.raisedByBranch;
    }

    if (body.raisedByProfilePic !== undefined) {
      updates.raisedByProfilePic = body.raisedByProfilePic;
    }

    if (body.volunteerId !== undefined) {
      updates.volunteerId = body.volunteerId;
    }

    if (body.volunteerName !== undefined) {
      updates.volunteerName = body.volunteerName;
    }

    if (body.resolvedAt !== undefined) {
      updates.resolvedAt = body.resolvedAt;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(existingComplaint[0], { status: 200 });
    }

    const updatedComplaint = await db.update(complaints)
      .set(updates)
      .where(eq(complaints.id, complaintId))
      .returning();

    return NextResponse.json(updatedComplaint[0], { status: 200 });
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

    const complaintId = parseInt(id);

    const existingComplaint = await db.select()
      .from(complaints)
      .where(eq(complaints.id, complaintId))
      .limit(1);

    if (existingComplaint.length === 0) {
      return NextResponse.json({ 
        error: 'Complaint not found',
        code: 'NOT_FOUND' 
      }, { status: 404 });
    }

    const deleted = await db.delete(complaints)
      .where(eq(complaints.id, complaintId))
      .returning();

    return NextResponse.json({ 
      message: 'Complaint deleted successfully',
      complaint: deleted[0]
    }, { status: 200 });
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}