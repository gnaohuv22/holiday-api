import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Danh sách các nguồn (origins) được phép truy cập API
const allowedOrigins = [
  'http://localhost:3000',
  'https://holiday-api-ruby.vercel.app',
  // Thêm các domain khác mà bạn muốn cho phép ở đây
];

// Danh sách các HTTP methods được phép
const allowedMethods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'];

// Middleware để xử lý CORS
export function middleware(request: NextRequest) {
  // Lấy origin từ request header
  const origin = request.headers.get('origin') || '';
  const requestMethod = request.method;
  const requestPath = request.nextUrl.pathname;
  
  // Chỉ áp dụng CORS cho các route API
  if (requestPath.startsWith('/api/')) {
    // Kiểm tra nếu origin không được phép và không phải là * (tất cả)
    const isAllowedOrigin = allowedOrigins.includes(origin) || allowedOrigins.includes('*');
    
    // Nếu là preflight request (OPTIONS)
    if (requestMethod === 'OPTIONS') {
      return new NextResponse(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': isAllowedOrigin ? origin : allowedOrigins[0],
          'Access-Control-Allow-Methods': allowedMethods.join(', '),
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400', // Cache preflight request trong 24h
        },
      });
    }
    
    // Tạo response
    const response = NextResponse.next();
    
    // Thêm CORS headers vào response
    response.headers.set('Access-Control-Allow-Origin', isAllowedOrigin ? origin : allowedOrigins[0]);
    response.headers.set('Access-Control-Allow-Methods', allowedMethods.join(', '));
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return response;
  }
  
  // Không áp dụng CORS cho các route không phải API
  return NextResponse.next();
}

// Chỉ áp dụng middleware cho các route API
export const config = {
  matcher: '/api/:path*',
}; 