import { NextRequest } from 'next/server';
import { POST as mainHandler } from '../route';

// This file ensures that /api/holidays/import-static works as a route
export async function POST(req: NextRequest) {
  return mainHandler(req);
} 