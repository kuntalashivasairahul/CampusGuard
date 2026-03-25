# College Lost & Found - CampusFind

## Overview

A full-stack College Lost & Found platform (CampusFind) built with React + Vite frontend and Express API server. Restricted to college members using official college email IDs.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite (artifacts/lost-and-found)
- **API framework**: Express 5 (artifacts/api-server)
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Auth**: Session-based (express-session + connect-pg-simple)
- **AI Chatbot**: OpenAI GPT via Replit AI Integrations
- **Build**: esbuild (backend), Vite (frontend)

## Features

- **Authentication**: College email + OTP-based registration & login (2-step verification)
- **Home Feed**: Instagram-style vertical feed of Lost/Found item cards
- **Report Item**: Upload photos (base64), category selection, location tagging
- **Secure Claim System**: OTP-based claim verification between finder and owner
- **My Activity**: Track reported items and claims
- **Admin Panel**: Stats dashboard, transaction logs, post management, flag suspicious claims
- **AI Support Chatbot**: Powered by GPT for dispute resolution

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express API server
│   └── lost-and-found/     # React + Vite frontend (previewPath: /)
├── lib/
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   ├── db/                 # Drizzle ORM schema + DB connection
│   └── integrations-openai-ai-server/ # OpenAI AI integration
├── scripts/                # Utility scripts
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## Database Schema

- **users** - College members (students, faculty, admins)
- **otps** - OTP records for registration/login verification
- **items** - Lost/Found items with type, category, location, status
- **claims** - Claim records with OTP for item return verification
- **session** - Express session storage (auto-created by connect-pg-simple)

## API Routes

- `POST /api/auth/register` - Register with college email (sends OTP)
- `POST /api/auth/verify-registration` - Verify OTP and create account
- `POST /api/auth/login` - Login (sends OTP)
- `POST /api/auth/verify-login` - Verify OTP and login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout
- `GET /api/items` - List items (feed) with filters
- `POST /api/items` - Create item
- `POST /api/items/upload-image` - Upload image (base64)
- `GET /api/items/:id` - Get item detail
- `DELETE /api/items/:id` - Delete item
- `POST /api/claims` - Initiate claim (generates OTP)
- `POST /api/claims/:id/verify` - Verify claim OTP (marks returned)
- `GET /api/claims/my` - My activity
- `GET /api/admin/stats` - Admin statistics
- `GET /api/admin/items` - Admin all items
- `GET /api/admin/transactions` - Transaction logs
- `DELETE /api/admin/items/:id` - Delete item (admin)
- `POST /api/admin/claims/:id/flag` - Flag suspicious claim
- `POST /api/chat/message` - AI chatbot message

## Demo Accounts

- Student: `student@college.edu` / `password123`
- Admin: `admin@college.edu` / `admin123`
- Note: Login requires OTP (shown in response during demo mode)

## Item Categories

Electronics, Bags, Clothing, Books, Keys, ID Cards, Jewelry, Sports Equipment, Other

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists lib packages as project references.

- Run codegen: `pnpm --filter @workspace/api-spec run codegen`
- Push DB schema: `pnpm --filter @workspace/db run push`
- Build API server: `pnpm --filter @workspace/api-server run build`
