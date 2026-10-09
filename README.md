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
- API health: http://localhost:3000/api/health
- Swagger: http://localhost:3000/api/docs

## Cấu trúc

```text
apps/web                 Vue frontend
apps/api                 NestJS backend
packages/shared-types    Kiểu dữ liệu dùng chung
infrastructure           Cấu hình triển khai
docs                     Tài liệu nghiệp vụ
```

Không đưa khóa MoMo hoặc Cloudflare R2 vào frontend và Git.
