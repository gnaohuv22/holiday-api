# Holiday Handler API

A simple API service to manage holidays for integration with other projects. The service provides endpoints to create, read, update, and delete holidays.

## Features

- RESTful API for holiday management
- Firebase Firestore database for data storage
- Dark mode / Light mode support
- Simple admin interface for managing holidays
- Fully responsive design

## API Endpoints

- `GET /api/holidays?year=2025` - Get all holidays for a specific year
- `GET /api/holidays/[id]` - Get a specific holiday by ID
- `POST /api/holidays` - Create a new holiday
- `PUT /api/holidays/[id]` - Update an existing holiday
- `DELETE /api/holidays/[id]` - Delete a holiday

## Getting Started

### Prerequisites

- Node.js 18+ (recommended)
- npm (or yarn)
- Firebase account

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd holiday-handler
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file with your Firebase configuration:
```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your-measurement-id
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Deployment

### Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme).

1. Push your code to a Git repository (GitHub, GitLab, or BitBucket)
2. Import your project on Vercel
3. Add your environment variables from `.env.local`
4. Click Deploy

## Tech Stack

- [Next.js](https://nextjs.org/) - React framework
- [Firebase](https://firebase.google.com/) - Backend and database
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [TypeScript](https://www.typescriptlang.org/) - Type checking

## License

This project is licensed under the MIT License - see the LICENSE file for details.
