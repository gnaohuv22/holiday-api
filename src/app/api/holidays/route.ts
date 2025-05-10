import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  addDoc, 
  serverTimestamp
} from 'firebase/firestore';
import { Holiday } from '@/types/holiday';

// Static Vietnam holidays for import
const staticVietnamHolidays: Omit<Holiday, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Tết Dương lịch',
    description: 'Ngày đầu năm dương lịch',
    startDate: new Date(new Date().getFullYear(), 0, 1).toISOString(), // Jan 1
    isRecurring: true,
    type: 'static',
    isActive: true
  },
  {
    name: 'Giải phóng miền Nam',
    description: 'Ngày giải phóng miền Nam, thống nhất đất nước',
    startDate: new Date(new Date().getFullYear(), 3, 30).toISOString(), // Apr 30
    isRecurring: true,
    type: 'static',
    isActive: true
  },
  {
    name: 'Quốc tế Lao động',
    description: 'Ngày Quốc tế Lao động',
    startDate: new Date(new Date().getFullYear(), 4, 1).toISOString(), // May 1
    isRecurring: true,
    type: 'static',
    isActive: true
  },
  {
    name: 'Quốc khánh',
    description: 'Ngày Quốc khánh nước Cộng hòa Xã hội Chủ nghĩa Việt Nam',
    startDate: new Date(new Date().getFullYear(), 8, 2).toISOString(), // Sep 2
    isRecurring: true,
    type: 'static',
    isActive: true
  }
];

// GET handler for all holiday-related GET requests
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const pathname = url.pathname;

    // Handle /api/holidays/upcoming
    if (pathname.endsWith('/upcoming')) {
      return handleUpcomingHolidays();
    }
    
    // Handle /api/holidays/in-range
    if (pathname.endsWith('/in-range')) {
      return handleHolidaysInRange(url);
    }
    
    // Handle regular /api/holidays - with or without year parameter
    return handleGetHolidays(url);
  } catch (error) {
    console.error('Error in GET handler:', error);
    return NextResponse.json(
      { error: 'An error occurred processing your request' }, 
      { status: 500 }
    );
  }
}

// POST handler for all holiday-related POST requests
export async function POST(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const pathname = url.pathname;
    
    // Handle /api/holidays/import-static
    if (pathname.endsWith('/import-static')) {
      return handleImportStaticHolidays();
    }
    
    // Handle regular /api/holidays POST (create new holiday)
    return handleCreateHoliday(req);
  } catch (error) {
    console.error('Error in POST handler:', error);
    return NextResponse.json(
      { error: 'An error occurred processing your request' }, 
      { status: 500 }
    );
  }
}

// Handler for GET /api/holidays
async function handleGetHolidays(url: URL) {
  try {
    const year = url.searchParams.get('year');
    
    if (!year) {
      // If no year is provided, return all holidays
      const holidaysRef = collection(db, 'holidays');
      const querySnapshot = await getDocs(holidaysRef);
      const holidays: Holiday[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        holidays.push({
          id: doc.id,
          name: data.name,
          description: data.description || '',
          startDate: data.startDate,
          endDate: data.endDate || null,
          isRecurring: data.isRecurring || false,
          type: data.type || 'dynamic',
          isActive: data.isActive ?? true,
          createdAt: data.createdAt?.toDate().toISOString() || new Date().toISOString(),
          updatedAt: data.updatedAt?.toDate().toISOString() || new Date().toISOString(),
        });
      });

      // Sort holidays by startDate (ascending)
      holidays.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

      return NextResponse.json(holidays);
    }

    // Validate year format and range
    const yearNum = parseInt(year);
    if (isNaN(yearNum) || yearNum < 1900 || yearNum > 2100) {
      return NextResponse.json(
        { error: 'Invalid year format or out of range (1900-2100)' }, 
        { status: 400 }
      );
    }

    // Calculate date range for the requested year (start and end dates)
    const startDate = new Date(`${year}-01-01`).toISOString();
    const endDate = new Date(`${yearNum + 1}-01-01`).toISOString();

    // Query Firestore for holidays within date range
    const holidaysRef = collection(db, 'holidays');
    
    // Handle both recurring and non-recurring holidays
    const querySnapshot = await getDocs(holidaysRef);
    const holidays: Holiday[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const holidayStartDate = new Date(data.startDate);
      const holiday: Holiday = {
        id: doc.id,
        name: data.name,
        description: data.description || '',
        startDate: data.startDate,
        endDate: data.endDate || null,
        isRecurring: data.isRecurring || false,
        type: data.type || 'dynamic',
        isActive: data.isActive ?? true,
        createdAt: data.createdAt?.toDate().toISOString() || new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate().toISOString() || new Date().toISOString(),
      };

      // Include holiday if:
      // 1. It's recurring (yearly) - we'll adjust the year to match requested year
      // 2. It falls within the requested year's range (for non-recurring)
      if (data.isRecurring) {
        // For recurring holidays, adjust the year to the requested year
        const adjustedStartDate = new Date(holidayStartDate);
        adjustedStartDate.setFullYear(yearNum);
        holiday.startDate = adjustedStartDate.toISOString();
        
        if (data.endDate) {
          const holidayEndDate = new Date(data.endDate);
          const adjustedEndDate = new Date(holidayEndDate);
          adjustedEndDate.setFullYear(yearNum);
          holiday.endDate = adjustedEndDate.toISOString();
        }
        
        holidays.push(holiday);
      } else {
        // For non-recurring holidays, check if they fall within the year
        if (holidayStartDate >= new Date(startDate) && holidayStartDate < new Date(endDate)) {
          holidays.push(holiday);
        }
      }
    });

    // Sort holidays by startDate (ascending)
    holidays.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

    return NextResponse.json(holidays);
  } catch (error) {
    console.error('Error fetching holidays:', error);
    return NextResponse.json(
      { error: 'Failed to fetch holidays' }, 
      { status: 500 }
    );
  }
}

// Handler for POST /api/holidays (create new holiday)
async function handleCreateHoliday(req: NextRequest) {
  try {
    // Parse request body
    const body = await req.json();
    const { 
      name, 
      description, 
      startDate, 
      endDate, 
      isRecurring = false, 
      type = 'dynamic', 
      isActive = true 
    } = body;

    // Validate required fields
    if (!startDate || !name) {
      return NextResponse.json(
        { error: 'Start date and name are required fields' }, 
        { status: 400 }
      );
    }

    // Validate date format
    if (!isValidISODate(startDate)) {
      return NextResponse.json(
        { error: 'Invalid start date format. Use ISO 8601 format (YYYY-MM-DDT00:00:00.000Z)' }, 
        { status: 400 }
      );
    }

    // Validate end date if provided
    if (endDate && !isValidISODate(endDate)) {
      return NextResponse.json(
        { error: 'Invalid end date format. Use ISO 8601 format (YYYY-MM-DDT00:00:00.000Z)' }, 
        { status: 400 }
      );
    }

    // Create new holiday document
    const holidaysRef = collection(db, 'holidays');
    const newHoliday = {
      name,
      description: description || '',
      startDate,
      endDate: endDate || null,
      isRecurring,
      type,
      isActive,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    // Add document to Firestore
    const docRef = await addDoc(holidaysRef, newHoliday);

    // Return created holiday with ID
    return NextResponse.json({
      id: docRef.id,
      ...newHoliday,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating holiday:', error);
    return NextResponse.json(
      { error: 'Failed to create holiday' }, 
      { status: 500 }
    );
  }
}

// Handler for POST /api/holidays/import-static
async function handleImportStaticHolidays() {
  try {
    const holidaysRef = collection(db, 'holidays');
    const importResults = [];

    // Import each static holiday
    for (const holiday of staticVietnamHolidays) {
      // Check if a similar holiday already exists to prevent duplicates
      const q = query(
        holidaysRef, 
        where('name', '==', holiday.name),
        where('isRecurring', '==', true),
        where('type', '==', 'static')
      );
      
      const existingHolidays = await getDocs(q);
      
      if (existingHolidays.empty) {
        // Only add if not already in the database
        const newHoliday = {
          ...holiday,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        
        const docRef = await addDoc(holidaysRef, newHoliday);
        importResults.push({
          id: docRef.id,
          name: holiday.name,
          status: 'added'
        });
      } else {
        importResults.push({
          id: existingHolidays.docs[0].id,
          name: holiday.name,
          status: 'already_exists'
        });
      }
    }

    return NextResponse.json({
      message: 'Static holidays import completed',
      results: importResults,
      totalAdded: importResults.filter(r => r.status === 'added').length,
      totalSkipped: importResults.filter(r => r.status === 'already_exists').length
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error importing static holidays:', error);
    return NextResponse.json(
      { error: 'Failed to import static holidays' }, 
      { status: 500 }
    );
  }
}

// Handler for GET /api/holidays/upcoming
async function handleUpcomingHolidays() {
  try {
    const today = new Date();
    const threeMonthsLater = new Date();
    threeMonthsLater.setMonth(today.getMonth() + 3);
    
    // Get all holidays
    const holidaysRef = collection(db, 'holidays');
    const querySnapshot = await getDocs(holidaysRef);
    const allHolidays: Holiday[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      allHolidays.push({
        id: doc.id,
        name: data.name,
        description: data.description || '',
        startDate: data.startDate,
        endDate: data.endDate || null,
        isRecurring: data.isRecurring || false,
        type: data.type || 'dynamic',
        isActive: data.isActive ?? true,
        createdAt: data.createdAt?.toDate().toISOString() || new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate().toISOString() || new Date().toISOString(),
      });
    });
    
    // Filter holidays that are upcoming (within the next 3 months)
    const upcomingHolidays = allHolidays.filter(holiday => {
      let holidayDate = new Date(holiday.startDate);
      
      // If it's a recurring holiday, adjust to current year
      if (holiday.isRecurring) {
        holidayDate = new Date(holidayDate);
        holidayDate.setFullYear(today.getFullYear());
        
        // If the date has already passed this year, use next year
        if (holidayDate < today) {
          holidayDate.setFullYear(today.getFullYear() + 1);
        }
      }
      
      // Check if the holiday is in the upcoming 3 months and is active
      return holiday.isActive && holidayDate >= today && holidayDate <= threeMonthsLater;
    });
    
    // Sort by start date
    upcomingHolidays.sort((a, b) => {
      const dateA = new Date(a.startDate);
      const dateB = new Date(b.startDate);
      
      // If recurring, adjust to current year for comparison
      if (a.isRecurring) {
        dateA.setFullYear(today.getFullYear());
        if (dateA < today) dateA.setFullYear(today.getFullYear() + 1);
      }
      
      if (b.isRecurring) {
        dateB.setFullYear(today.getFullYear());
        if (dateB < today) dateB.setFullYear(today.getFullYear() + 1);
      }
      
      return dateA.getTime() - dateB.getTime();
    });
    
    return NextResponse.json(upcomingHolidays);
  } catch (error) {
    console.error('Error fetching upcoming holidays:', error);
    return NextResponse.json(
      { error: 'Failed to fetch upcoming holidays' }, 
      { status: 500 }
    );
  }
}

// Handler for GET /api/holidays/in-range
async function handleHolidaysInRange(url: URL) {
  try {
    const start = url.searchParams.get('start');
    const end = url.searchParams.get('end');
    
    if (!start || !end) {
      return NextResponse.json(
        { error: 'Both start and end parameters are required' }, 
        { status: 400 }
      );
    }
    
    // Validate date formats
    if (!isValidISODateSimple(start) || !isValidISODateSimple(end)) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD format' }, 
        { status: 400 }
      );
    }
    
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date values' }, 
        { status: 400 }
      );
    }
    
    // Get all holidays
    const holidaysRef = collection(db, 'holidays');
    const querySnapshot = await getDocs(holidaysRef);
    const allHolidays: Holiday[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      allHolidays.push({
        id: doc.id,
        name: data.name,
        description: data.description || '',
        startDate: data.startDate,
        endDate: data.endDate || null,
        isRecurring: data.isRecurring || false,
        type: data.type || 'dynamic',
        isActive: data.isActive ?? true,
        createdAt: data.createdAt?.toDate().toISOString() || new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate().toISOString() || new Date().toISOString(),
      });
    });
    
    // Filter holidays that fall within the specified range
    const holidaysInRange = allHolidays.filter(holiday => {
      // Skip inactive holidays
      if (!holiday.isActive) return false;
      
      let holidayStartDate = new Date(holiday.startDate);
      let holidayEndDate = holiday.endDate ? new Date(holiday.endDate) : new Date(holidayStartDate);
      
      // If it's a recurring holiday, adjust to the year of the start parameter
      if (holiday.isRecurring) {
        const year = startDate.getFullYear();
        
        holidayStartDate = new Date(holidayStartDate);
        holidayStartDate.setFullYear(year);
        
        holidayEndDate = new Date(holidayEndDate);
        holidayEndDate.setFullYear(year);
        
        // If the date range spans two years, we need to check next year too
        if (startDate.getFullYear() !== endDate.getFullYear()) {
          // This is a simplification - a more complete implementation would check
          // for all years in the range and add occurrences for each year
          const nextYear = endDate.getFullYear();
          const nextYearStart = new Date(holidayStartDate);
          nextYearStart.setFullYear(nextYear);
          
          const nextYearEnd = new Date(holidayEndDate);
          nextYearEnd.setFullYear(nextYear);
          
          // Check if either year's occurrence falls in range
          return (
            (holidayEndDate >= startDate && holidayStartDate <= endDate) ||
            (nextYearEnd >= startDate && nextYearStart <= endDate)
          );
        }
      }
      
      // Check if the holiday overlaps with the specified range
      return holidayEndDate >= startDate && holidayStartDate <= endDate;
    });
    
    // Sort by start date
    holidaysInRange.sort((a, b) => 
      new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );
    
    return NextResponse.json(holidaysInRange);
  } catch (error) {
    console.error('Error fetching holidays in range:', error);
    return NextResponse.json(
      { error: 'Failed to fetch holidays in range' }, 
      { status: 500 }
    );
  }
}

// Helper function to validate ISO date format
function isValidISODate(dateString: string) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/.test(dateString)) {
    return false;
  }
  
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

// Helper function to validate simpler date format (YYYY-MM-DD)
function isValidISODateSimple(dateString: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return false;
  }
  
  const date = new Date(dateString);
  return !isNaN(date.getTime());
} 