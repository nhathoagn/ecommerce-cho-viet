# Cách thêm unit test cho Phase 1

Plan Phase 1 bên dưới vẫn đúng cho năm file nền. Danh sách đầy đủ 500 case, có bước và expected, nằm ở `docs/unit-test-cases.md`.

Case trong file đó lấy từ code hiện tại. Mock Prisma và JWT. Không cần PostgreSQL, Redis, MoMo, hay Cloudflare.

## Cách đọc

Làm từ trên xuống. Xong một file thì chạy `pnpm --filter api test` trước khi mở file sau. Một mục xong khi lệnh đó thoát 0 và các `expect` mới nằm trong file.

Phần thân là các bước. Phụ lục chỉ giải thích claim nào đứng ngoài unit test.

## Giữ runner hiện có

- Thêm file `*.spec.ts` dưới `apps/api`. `apps/api/vitest.config.ts` đang include `**/*.spec.ts`.
- Chạy `pnpm --filter api test`. `pnpm test` ở root cũng tới các file đó, vì chỉ `apps/api` có script `test`.
- Đừng thêm script `test` cho `apps/web`. Web không có Vitest.
- Đừng đưa các case này vào `apps/api/test/app.e2e-spec.ts`. `pnpm test` không chạy file `*.e2e-spec.ts`.
- Đừng copy `apps/api/src/app.controller.spec.ts`. `getHello` không nằm trong README.
- Import kèm hậu tố `.js`, giống `apps/api/src/config/env.validation.spec.ts`.
- Mock bằng `vi.fn()`. Đừng thêm `vi.mock`.
- Đừng boot `AppModule` trong các spec mới. `ConfigModule` gọi `validateEnv` khi module khởi tạo, và `PrismaService.onModuleInit` gọi `$connect`.

## Bổ sung validateEnv

File đã có. `apps/api/src/config/env.validation.spec.ts`. Hàm là `validateEnv`. Giữ object `validEnv`. Thêm case. Đừng viết lại hai case cũ.

Case còn thiếu, theo `apps/api/src/config/env.validation.ts`.

- `validateEnv({})` phải ném `Environment validation failed` và message phải chứa cả bảy key không có default. Các key đó là `DATABASE_URL`, `REDIS_URL`, `MOMO_ENDPOINT`, `MOMO_REDIRECT_URL`, `MOMO_IPN_URL`, `CLOUDFLARE_R2_BUCKET_PUBLIC`, `CLOUDFLARE_R2_BUCKET_PRIVATE`. Case hiện tại chỉ kiểm prefix. Tên case nói là báo đủ biến thiếu, nhưng assertion chưa làm việc đó.
- `{ ...validEnv, NODE_ENV: 'staging' }` phải ném. Giá trị hợp lệ chỉ là `development`, `test`, `production`.
- `{ ...validEnv, PORT: 70000 }` phải ném. `Joi.number().port()` không nhận cổng đó.
- `{ ...validEnv, LOG_LEVEL: 'verbose' }` phải ném.
- `{ ...validEnv, JWT_ACCESS_SECRET: 'short' }` phải ném. Default dài hơn 16 ký tự, nên chỉ override ngắn mới chạm `.min(16)`. Làm cùng một case cho `JWT_REFRESH_SECRET`.
- `{ ...validEnv, REDIS_URL: 'localhost:6379' }` phải ném. Schema yêu cầu URI.
- `{ ...validEnv, EXTRA: 'kept' }` phải trả `EXTRA` bằng `kept`. Việc này khóa `allowUnknown: true` và `stripUnknown: false` mà không boot `ConfigModule`.

Đừng thêm case cho từng URL default của MoMo. Default đó không phải claim trong README.

Xong thì chạy `pnpm --filter api test -- src/config/env.validation.spec.ts`.

## Thêm spec cho ResponseInterceptor

Tạo `apps/api/src/common/interceptors/response.interceptor.spec.ts`.

Gọi `new ResponseInterceptor()`. `intercept` nhận một `ExecutionContext` giả và một `CallHandler`. `switchToHttp().getRequest()` trả `{ url: '/api/health/live' }`. `handle()` trả `of({ status: 'ok' })`.

Object phát ra phải có `success` bằng `true`, `data` bằng `{ status: 'ok' }`, và `path` bằng `/api/health/live`. `timestamp` phải parse được bằng `Date.parse`. Đừng khóa giá trị giờ.

Thêm một case `handle()` trả `of(null)`. `data` phải là `null`, không phải bị bỏ key.

Spec này không chứng minh `bootstrap` trong `apps/api/src/main.ts` đã gọi `useGlobalInterceptors`. Đừng boot Nest để "vá" chỗ đó trong unit test.

Xong thì chạy `pnpm --filter api test -- src/common/interceptors/response.interceptor.spec.ts`.

## Thêm spec cho AllExceptionsFilter

Tạo `apps/api/src/common/filters/http-exception.filter.spec.ts`.

Gọi `new AllExceptionsFilter({ error: vi.fn() } as unknown as Logger)`. `Logger` lấy từ `nestjs-pino`.

`ArgumentsHost` giả có `switchToHttp()`. Request là `{ method: 'GET', url: '/api/health/live' }`. `response.status` trả object có `json: vi.fn()`.

Bốn case, đúng thứ tự các nhánh trong `resolveMessage`.

- `new HttpException('nope', 400)` ghi status 400. Body có `success` bằng `false`, `error.statusCode` bằng 400, `error.message` bằng `nope`, `path` bằng URL của request.
- `new HttpException({ message: ['a', 'b'] }, 400)` giữ `error.message` là mảng `['a', 'b']`.
- `new Error('db down')` ghi status 500 và `error.message` bằng `db down`.
- Giá trị không phải `Error` ghi status 500 và `error.message` bằng `Internal server error`.

Một `expect` trên `logger.error` là đủ. Filter câm không được xanh.

Spec này không chứng minh `useGlobalFilters` trong `bootstrap`. Đừng boot app.

Xong thì chạy `pnpm --filter api test -- src/common/filters/http-exception.filter.spec.ts`.

## Thêm spec cho HealthController

Tạo `apps/api/src/modules/health/health.controller.spec.ts`.

Khởi tạo thẳng `HealthController`. Đừng dùng `Test.createTestingModule`.

`live()` trả `{ status: 'ok', service: 'ecommerce-api' }`. `$queryRaw` không được bị gọi.

`check()` là method của route `ready`. Mock `HealthCheckService.check` bằng hàm gọi indicator đầu tiên, rồi mới assert kết quả indicator. Đừng giả `check` trả sẵn `{ database: { status: 'up' } }`. Giả như vậy thì test xanh kể cả khi closure không gọi Prisma.

- `$queryRaw` resolve thì kết quả indicator là `{ database: { status: 'up' } }` và `$queryRaw` đã được gọi.
- `$queryRaw` reject thì promise của `check()` reject.

Đừng mở PostgreSQL. Đừng assert URL `/api/health/ready`. Gọi `check()` không chạy decorator `@Get('ready')`.

Xong thì chạy `pnpm --filter api test -- src/modules/health/health.controller.spec.ts`.

## Xuất pinoRedactPaths rồi mới test

`LoggerModule.forRoot` trong `apps/api/src/app.module.ts` đang để mảng redact ngay trong object. Không có hàm export. Một spec chép lại bốn string sẽ vẫn xanh khi `app.module.ts` đổi mảng.

Xuất đúng mảng đó thành `export const pinoRedactPaths` trong `apps/api/src/app.module.ts`. `redact` nhận constant đó. Đừng tạo file config mới.

Tạo `apps/api/src/app.module.spec.ts`. Import `pinoRedactPaths` từ `./app.module.js`. Expect đúng bốn path, đúng thứ tự.

- `req.headers.authorization`
- `req.headers.cookie`
- `*.password`
- `*.secretKey`

Đừng tạo logger và đừng in secret ra để "chứng minh" Pino. Việc redact của Pino là việc của thư viện. Claim mà repo này sở hữu là danh sách path.

Đừng thêm path `secret` cho khớp câu trong README. Code không redact một field tên `secret`, và không redact `MOMO_SECRET_KEY`. `*.secretKey` chỉ khớp field tên `secretKey`. `*.password` không có trong câu README, nhưng code đang có. Test phải giữ nó. Bỏ nó sẽ log password.

Đừng test nhánh `pino-pretty`. Nhánh đó đọc `process.env.NODE_ENV` lúc load module. Dynamic import để đổi env không đáng một case.

Xong thì chạy `pnpm --filter api test -- src/app.module.spec.ts`.

## Dừng khi năm file này xanh

Chạy `pnpm test` một lần sau file cuối. Lệnh đó phải thoát 0.

Năm file là toàn bộ unit test của plan này.

- `apps/api/src/config/env.validation.spec.ts`
- `apps/api/src/common/interceptors/response.interceptor.spec.ts`
- `apps/api/src/common/filters/http-exception.filter.spec.ts`
- `apps/api/src/modules/health/health.controller.spec.ts`
- `apps/api/src/app.module.spec.ts`

Đừng viết spec cho Docker, CI, Swagger UI, hay `PrismaService`. Lý do nằm ở phụ lục A.

## Phụ lục A. Claim README không phải unit test

`README.md` còn bốn claim mà unit test không chứng minh được.

Swagger tại `/api/docs` nằm trong `bootstrap`, và `bootstrap` không export. `apps/api/src/api-contract.spec.ts` boot `AppModule` để kiểm path OpenAPI của frontend. File đó không phải unit test, và không chứng minh `SwaggerModule.setup('api/docs', ...)`. Muốn kiểm URL thì start API rồi GET `http://localhost:3000/api/docs`. Việc đó đứng ngoài plan này.

`PrismaService` chỉ gọi `$connect` trong `onModuleInit` và `$disconnect` trong `onModuleDestroy`. Một spy trên hai method đó lặp lại thân hàm. `DatabaseModule` export `PrismaService` và đánh `@Global()`. CI đã chạy `pnpm --filter api prisma validate`. Migration đầu là `apps/api/prisma/migrations/20261009170000_init`. Đừng viết spec đọc file SQL.

Docker multi-stage không có symbol để gọi. Job `docker` trong `.github/workflows/ci.yml` build `apps/api/Dockerfile` và `apps/web/Dockerfile` với `push: false`. Đó là check thật.

CI không cần spec parse YAML. Job `quality` chạy `pnpm install --frozen-lockfile`, `pnpm db:generate`, `pnpm lint`, `pnpm test`, `pnpm build`, rồi `pnpm --filter api prisma validate`. Workflow chỉ chạy trên push `main` và trên pull request.

## Phụ lục B. Code không nằm trong README

Đừng thêm spec cho các module này trong plan Phase 1. README không mô tả hành vi của chúng.

- `auth` có `AuthService`. `auth.controller.spec.ts` và `auth.guards.spec.ts` đã có, nhưng không phải claim Phase 1.
- `users` có `UsersService`. Không có spec.
- `seller-catalog` có `SellerCatalogService` và `CatalogService`. Không có spec.
- `catalog` không có service riêng. Không có spec.
- `uploads` có `UploadsService`. Không có spec.
- `cart` có `CartService`. Không có spec.
- `orders` có `OrdersService`. Không có spec.
- `payments` có `PaymentsService`. Không có spec.
- `seller-finance` có `SellerFinanceService`. Không có spec.
- `operations` có `OperationsService`. Không có spec.

Các thư mục rỗng `notifications`, `wallets`, `reviews`, `shipping`, `coupons`, `carts`, `inventory`, `products`, `categories`, `stores`, `sellers` không có service. Đừng tạo spec cho chúng.

`docs/features/map.json` ghi FEAT-001 và FEAT-002. Đó là feature của verification map, không phải mục Nền tảng Phase 1. Đừng lấy chúng làm nguồn case.

## Phụ lục C. Rủi ro còn lại

Unit test của interceptor và filter không biết `main.ts` có còn đăng ký chúng hay không. Lệch wiring chỉ hiện khi có request HTTP thật.

Test `pinoRedactPaths` khóa danh sách path. Test đó không chứng minh một dòng log đã bị che.

Test `HealthController.check` không chứng minh route là `/api/health/ready`. Terminus cũng không chạy, vì mock tự gọi indicator.

Import `pinoRedactPaths` từ `app.module.ts` sẽ load toàn bộ module graph. Nếu import đó kéo `$connect` hoặc đòi env thiếu, dời constant sang `apps/api/src/config/pino-redact.ts`, để `app.module.ts` import cùng binding, rồi test binding đó. Đừng chép mảng sang spec.
