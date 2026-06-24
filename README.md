# Haus Of Estate

AI-powered real estate platform for the UAE market.

## What is this?

Haus Of Estate is a full-lifecycle property platform — from discovering properties to closing deals. Unlike typical listing sites that just show photos and prices, this platform focuses on trust, verification, and actually completing transactions. Built for buyers, investors, developers, and agents who want a smarter way to handle property in the UAE.

## Features

- Verified, up-to-date property listings (no stale or duplicate data)
- AI-powered search and property recommendations
- Agent profiles with reputation tied to real deals
- Content management via Sanity CMS
- User authentication with multiple sign-in options
- Mobile-responsive, video-first design for modern buyers

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js (React, TypeScript) |
| **Database** | PostgreSQL + Prisma ORM |
| **CMS** | Sanity (headless content management) |
| **Auth** | NextAuth with multiple providers |
| **UI** | Tailwind CSS, shadcn/ui |
| **Deploy** | Docker Compose |

## Architecture

```
Users
  └── Next.js Frontend
        ├── API Routes → PostgreSQL (Prisma)
        ├── Sanity CMS → Property content + media
        └── Auth Layer → User management + sessions
```

## Getting Started

```bash
git clone https://github.com/deb-pradhan/Haus-Of-Estate.git
cd Haus-Of-Estate
npm install
cp .env.example .env   # configure database, Sanity, and auth
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Docker

```bash
docker compose up
```

## License

MIT
