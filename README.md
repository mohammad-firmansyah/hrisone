# HRIS One Monorepo

Monorepo containing the HRIS One backend (NestJS microservice + TypeORM) and frontend (React + Vite + TypeScript).

## Structure

```text
hrisone/
├── apps/
│   ├── backend/         # NestJS microservice & TypeORM MySQL database
│   │   ├── src/
│   │   │   ├── attendance/
│   │   │   ├── role/
│   │   │   ├── user/
│   │   │   └── db/
│   │   │       ├── datasource/MysqlDatasource.ts
│   │   │       └── migrations/
│   │   └── package.json
│   └── frontend/        # React + TypeScript + Vite web app
│       ├── src/
│       │   ├── App.tsx
│       │   └── main.tsx
│       └── package.json
├── package.json         # Workspace root configuration
└── bun.lock
```

## Quick Start

### 1. Install Dependencies
```bash
bun install
```

### 2. Development

```bash
# Start backend (NestJS in watch mode)
bun run dev:backend

# Start frontend (Vite dev server)
bun run dev:frontend
```

### 3. Build & Test

```bash
# Build both frontend and backend
bun run build

# Run unit tests
bun run test

# Run linter
bun run lint
```

### 4. Database Migrations (TypeORM)

Run these directly from the root workspace:

```bash
# Run pending migrations
bun run migration:run

# Check migration status
bun run migration:show

# Revert last migration
bun run migration:revert

# Generate a new migration
bun run --filter @hrisone/backend typeorm migration:generate ./src/db/migrations/<migration-name> -d src/db/datasource/MysqlDatasource.ts
```
