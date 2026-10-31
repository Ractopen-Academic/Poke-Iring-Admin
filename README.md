# Poke-Iring Admin

Administrative portal and operations console for the Poke-Iring platform.

## Architecture

This project is built with:
- **Framework**: Next.js (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Authentication & Database**: Firebase Client SDK & Firebase Admin SDK
- **Backend Compatibility**: Direct Firestore access for client listeners, with server Route Handlers ready to proxy or migrate to a FastAPI / Node.js backend.

## Directory Structure

```
Poke-Iring-Admin/
├── src/
│   ├── app/                 # Next.js App Router (pages, layouts, route handlers)
│   ├── components/          # Reusable UI primitives and shared components
│   ├── features/            # Domain-driven feature modules (territory, users, analytics)
│   ├── lib/
│   │   ├── firebase/
│   │   │   ├── client.ts    # Firebase Client SDK initialization (browser)
│   │   │   └── admin.ts     # Firebase Admin SDK initialization (server-only)
│   │   └── utils.ts         # Style merging and helper utilities
│   └── types/               # Shared TypeScript domain definitions
├── .env.example             # Environment variable template
└── package.json
```

## Getting Started

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Configure Environment

Copy `.env.example` to `.env.local` and supply your Firebase project credentials:

```bash
cp .env.example .env.local
```

### 3. Run Development Server

```bash
pnpm dev
```

The portal will be accessible at `http://localhost:3000`.

### 4. Build for Production

```bash
pnpm build
pnpm start
```
