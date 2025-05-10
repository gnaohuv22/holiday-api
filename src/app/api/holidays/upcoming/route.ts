import { NextRequest } from 'next/server';
import { GET as mainHandler } from '../route';

// This file ensures that /api/holidays/upcoming works as a route
export async function GET(req: NextRequest) {
  return mainHandler(req);
} 