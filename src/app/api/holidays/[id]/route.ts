import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { 
  doc, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp 
} from 'firebase/firestore';

// GET single holiday by ID
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Extract ID from params
    const { id } = await context.params;

    const holidayRef = doc(db, 'holidays', id);
    const holidaySnap = await getDoc(holidayRef);

    if (!holidaySnap.exists()) {
      return NextResponse.json(
        { error: 'Holiday not found' }, 
        { status: 404 }
      );
    }

    const data = holidaySnap.data();
    return NextResponse.json({
      id: holidaySnap.id,
      name: data.name,
      description: data.description || '',
      startDate: data.startDate,
      endDate: data.endDate || null,
      isRecurring: data.isRecurring || false,
      type: data.type || 'dynamic',
      isActive: data.isActive ?? true,
      createdAt: data.createdAt?.toDate().toISOString(),
      updatedAt: data.updatedAt?.toDate().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching holiday:', error);
    return NextResponse.json(
      { error: 'Failed to fetch holiday' }, 
      { status: 500 }
    );
  }
}

// PUT/update holiday by ID
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Extract ID from params
    const { id } = await context.params;
    const body = await request.json();
    const { 
      name, 
      description, 
      startDate, 
      endDate, 
      isRecurring, 
      type, 
      isActive 
    } = body;

    // Validation
    if (!startDate || !name) {
      return NextResponse.json(
        { error: 'Start date and name are required fields' }, 
        { status: 400 }
      );
    }

    // Check if holiday exists
    const holidayRef = doc(db, 'holidays', id);
    const holidaySnap = await getDoc(holidayRef);

    if (!holidaySnap.exists()) {
      return NextResponse.json(
        { error: 'Holiday not found' }, 
        { status: 404 }
      );
    }

    // Get current data to preserve fields that weren't provided
    const currentData = holidaySnap.data();

    // Update document
    const updateData = {
      name,
      description: description ?? currentData.description ?? '',
      startDate,
      endDate: endDate ?? currentData.endDate ?? null,
      isRecurring: isRecurring ?? currentData.isRecurring ?? false,
      type: type ?? currentData.type ?? 'dynamic',
      isActive: isActive ?? currentData.isActive ?? true,
      updatedAt: serverTimestamp(),
    };

    await updateDoc(holidayRef, updateData);

    return NextResponse.json({
      id,
      ...updateData,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error updating holiday:', error);
    return NextResponse.json(
      { error: 'Failed to update holiday' }, 
      { status: 500 }
    );
  }
}

// DELETE holiday by ID
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Extract ID from params
    const { id } = await context.params;

    // Check if holiday exists
    const holidayRef = doc(db, 'holidays', id);
    const holidaySnap = await getDoc(holidayRef);

    if (!holidaySnap.exists()) {
      return NextResponse.json(
        { error: 'Holiday not found' }, 
        { status: 404 }
      );
    }

    // Delete document
    await deleteDoc(holidayRef);

    return NextResponse.json({ 
      message: 'Holiday deleted successfully',
      id 
    });
  } catch (error) {
    console.error('Error deleting holiday:', error);
    return NextResponse.json(
      { error: 'Failed to delete holiday' }, 
      { status: 500 }
    );
  }
} 