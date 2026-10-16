# HRIS One Monorepo

Microservices architecture with an HTTP API Gateway, internal TCP microservice with TypeORM & MySQL, and a React + Vite frontend.

## Architecture

```text
[ React Frontend ]  (http://localhost:5173)
        │
        │ HTTP REST requests
        ▼
[ API Gateway ]     (http://localhost:3000)
        │
        │ NestJS ClientProxy (TCP port 3001)
        ▼
[ Backend Service ] (TCP port 3001)
        │
        │ TypeORM
        ▼
[ MySQL Database ]  (hrisone on port 3306)
```

## Structure

```text
hrisone/
├── apps/
│   ├── frontend/        # React + TypeScript + Vite web app (port 5173)
│   │   ├── src/
│   │   └── package.json
│   │
│   ├── gateway/         # NestJS HTTP REST API Gateway (port 3000)
│   │   ├── src/
│   │   │   ├── user/          # Forwards HTTP to TCP 'findAllUser', etc.
│   │   │   ├── role/          # Forwards HTTP to TCP 'findAllRole', etc.
│   │   │   ├── attendance/    # Forwards HTTP to TCP 'findAllAttendance', etc.
│   │   │   ├── app.module.ts  # Registers ClientProxy (BACKEND_SERVICE)
│   │   │   └── main.ts        # HTTP server with CORS enabled
│   │   └── package.json
│   │
│   └── backend/         # NestJS TCP Microservice & TypeORM MySQL (TCP port 3001)
│       ├── src/
│       │   ├── user/          # @MessagePattern handlers
│       │   ├── role/
│       │   ├── attendance/
│       │   └── db/
│       │       ├── datasource/MysqlDatasource.ts
│       │       └── migrations/
│       └── package.json
│
├── package.json         # Workspace root configuration
└── bun.lock
```

## Quick Start

### 1. Install Dependencies
```bash
bun install
```

### 2. Run the Services

Open separate terminals or run:

```bash
# Terminal 1: Backend Microservice (TCP port 3001)
bun run dev:backend

# Terminal 2: API Gateway (HTTP REST port 3000)
bun run dev:gateway

# Terminal 3: React Frontend (Vite port 5173)
bun run dev:frontend
```

Now you can open:
- **API Gateway in browser/Postman:** [http://localhost:3000/users](http://localhost:3000/users)
- **Frontend web app:** [http://localhost:5173](http://localhost:5173)

### 3. Build & Test
```bash
# Build all workspaces
bun run build

# Run unit tests
bun run test
```

### 4. Database Migrations (TypeORM)
```bash
# Run pending migrations
bun run migration:run

# Check migration status
bun run migration:show
```
