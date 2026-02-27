# AI SaaS Architect

> Generate structured SaaS architecture blueprint from user input

A monorepo containing a Next.js frontend and NestJS backend that helps developers and SaaS founders quickly design feature lists, role-permission matrices, database schemas, folder structures, and deployment suggestions.

## 🏗️ Monorepo Structure

```
AI_SaaS_Architect/
├── apps/
│   ├── web/              # Next.js frontend application
│   │   ├── src/
│   │   │   ├── app/      # App Router pages
│   │   │   └── lib/      # Utilities and API client
│   │   └── package.json
│   └── api/              # NestJS backend API
│       ├── src/
│       │   └── generation/  # Generation module
│       └── package.json
├── packages/
│   ├── types/            # Shared TypeScript types
│   │   └── src/
│   └── database/         # Prisma database client
│       ├── prisma/
│       └── src/
├── package.json          # Root package.json with workspace config
└── pnpm-workspace.yaml   # pnpm workspace configuration
```

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm >= 10.0.0 (or pnpm)
- PostgreSQL (or SQLite for simpler setup)
- OpenAI API Key

### Installation

1. **Clone and install dependencies:**

```bash
npm install
```

2. **Set up environment variables:**

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your credentials
# - Add your OpenAI API key
# - Configure your database URL
```

3. **Set up the database:**

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database (creates tables)
npm run db:push

# Or run migrations
npm run db:migrate
```

### Development

Run both frontend and backend concurrently:

```bash
npm run dev
```

Or run them separately:

```bash
# Frontend (Next.js) - http://localhost:3000
npm run dev:next

# Backend (NestJS) - http://localhost:4000
npm run dev:nest
```

### Build

```bash
# Build all apps
npm run build

# Build individually
npm run build:next
npm run build:nest
```

### Start Production

```bash
npm run start
```

## 📋 Features

- **Architecture Form**: Submit your SaaS idea with roles, monetization type, tenant type, and tech stack
- **AI-Powered Generation**: Get structured architecture blueprints using OpenAI
- **Result Display**: View project summary, MVP features, future features, role-permission matrix, database schema, and folder structure
- **History Page**: Access previously generated architectures
- **Copy Functionality**: Copy any section with a single click

## 🛠️ Tech Stack

### Frontend (apps/web)
- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS

### Backend (apps/api)
- NestJS 10
- TypeScript
- OpenAI API
- Prisma ORM

### Database (packages/database)
- PostgreSQL (or SQLite)
- Prisma Client

### Shared (packages/types)
- Shared TypeScript types and interfaces

## 📖 API Endpoints

### POST /api/generate
Generate a new architecture blueprint.

**Request:**
```json
{
  "idea": "string (min 30 chars)",
  "roles": ["string"],
  "monetization": "subscription | one-time | freemium | marketplace | internal-tool",
  "tenantType": "single | multi",
  "techStack": ["string"]
}
```

**Response:**
```json
{
  "id": "uuid",
  "data": {
    "project_summary": "string",
    "mvp_features": ["string"],
    "future_features": ["string"],
    "roles": [{ "name": "string", "description": "string", "permissions": ["string"] }],
    "database_schema": [{ "table_name": "string", "columns": [{ "name": "string", "type": "string", "description": "string" }] }],
    "folder_structure": { "frontend": ["string"], "backend": ["string"] }
  }
}
```

### GET /api/generation/:id
Get a specific generation by ID.

### GET /api/generations
Get all generations (history).

## 🗄️ Database Schema

The application uses a single `generations` table:

| Column              | Type      | Description                    |
|---------------------|-----------|--------------------------------|
| id                  | UUID      | Primary key                    |
| idea                | TEXT      | User input                     |
| roles_input         | TEXT      | Raw roles                      |
| monetization_type   | VARCHAR   | Selected option                |
| tenant_type         | VARCHAR   | Single/Multi                   |
| tech_stack          | JSON      | Selected stack                 |
| ai_response         | JSON      | Structured AI response         |
| created_at          | TIMESTAMP | Auto timestamp                 |

## 🔧 Development Commands

```bash
# Install dependencies
npm install

# Run development servers
npm run dev

# Run type checking
npm run typecheck

# Run linter
npm run lint

# Database commands
npm run db:generate    # Generate Prisma client
npm run db:push        # Push schema to database
npm run db:migrate     # Run migrations
npm run db:studio      # Open Prisma Studio
```

## 📝 Pages

- **Home (/)**: Architecture input form
- **Result (/result/:id)**: Display generated architecture blueprint
- **History (/history)**: List of previous generations

## ⚙️ Configuration

### Environment Variables

| Variable              | Description                    | Required |
|-----------------------|--------------------------------|----------|
| OPENAI_API_KEY        | OpenAI API key                 | Yes      |
| DATABASE_URL          | Database connection string     | Yes      |
| PORT                  | API server port (default: 4000)| No       |
| NEXT_PUBLIC_API_URL   | Frontend API URL               | No       |

## 🚫 Out of Scope (MVP)

- Deployment strategy
- Cloud hosting
- Payment integration
- Authentication
- CI/CD setup
- Repository generation

## 📄 License

MIT

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
