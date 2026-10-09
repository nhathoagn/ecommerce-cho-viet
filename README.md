# Ecommerce Marketplace

Source base cho web bán hàng với hai vai trò buyer và seller.

## Stack

- Vue 3, TypeScript, Vite, Pinia, Vue Router, TanStack Query
- NestJS, Prisma, PostgreSQL, Redis
- MoMo Sandbox cho thanh toán
- Cloudflare R2 cho file và ảnh
- pnpm workspace

## Chạy local

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
docker compose up -d
pnpm install
pnpm db:generate
pnpm db:migrate
pnpm dev
```

- Frontend: http://localhost:5173
- API liveness: http://localhost:3000/api/health/live
- API readiness: http://localhost:3000/api/health/ready
- Swagger: http://localhost:3000/api/docs

## Docker

Chỉ chạy hạ tầng để phát triển local:

```bash
pnpm docker:infra
```

Build và chạy toàn bộ web, API, PostgreSQL và Redis:

```bash
pnpm docker:app
```

Web container được mở tại `http://localhost:8080`. Nginx phục vụ Vue SPA và proxy `/api` sang NestJS.

## Database

```bash
pnpm db:generate       # Sinh Prisma Client
pnpm db:migrate        # Tạo/chạy migration trong development
pnpm db:deploy         # Chạy migration có sẵn ở staging/production
```

Migration ban đầu nằm trong `apps/api/prisma/migrations`.

## Quality checks

```bash
pnpm check
```

GitHub Actions kiểm tra dependency lock, lint, unit test, build, Prisma schema và Docker images trên push/PR.

## Nền tảng Phase 1

- Kiểm tra và validate biến môi trường khi API khởi động
- Structured logging bằng Pino, có che authorization, cookie và secret
- Response envelope và global exception filter thống nhất
- Swagger/OpenAPI tại `/api/docs`
- Liveness và database readiness probes
- Prisma service dùng chung, migration PostgreSQL ban đầu
- Docker multi-stage cho API và web
- GitHub Actions CI cho quality checks và Docker build

## Cấu trúc

```text
apps/web                 Vue frontend
apps/api                 NestJS backend
packages/shared-types    Kiểu dữ liệu dùng chung
infrastructure           Cấu hình triển khai
docs                     Tài liệu nghiệp vụ
```

Không đưa khóa MoMo hoặc Cloudflare R2 vào frontend và Git.
