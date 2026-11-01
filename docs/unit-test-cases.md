# 500 case unit test

Danh sách này cho kỹ sư viết unit test của API. Mỗi case có một bước và một expected lấy từ code hiện tại. Không có case nào cần PostgreSQL, Redis, MoMo, hay Cloudflare.

Mock Prisma và JWT bằng vi.fn(). Đừng boot AppModule. Đừng gọi mạng. Exception expected là class Nest và message đúng chuỗi trong service.

Tổng case là 500.

## Số case theo nhóm

- validateEnv có 74 case.
- ResponseInterceptor có 15 case.
- AllExceptionsFilter có 15 case.
- HealthController có 4 case.
- pinoRedactPaths có 3 case.
- RolesGuard có 6 case.
- JwtStrategy có 4 case.
- AuthService có 22 case.
- AuthController có 7 case.
- UsersService có 13 case.
- slugify có 8 case.
- SellerCatalogService có 26 case.
- CatalogService có 8 case.
- CartService có 17 case.
- OrdersService checkout có 26 case.
- OrdersService cancel có 12 case.
- OrdersService buyerOrder có 1 case.
- OrdersService buyerOrders có 1 case.
- OrdersService sellerOrders có 1 case.
- OrdersService sellerUpdate có 102 case.
- OrdersService createCoupon có 6 case.
- PaymentsService có 35 case.
- SellerFinanceService có 4 case.
- OperationsService có 18 case.
- OperationsGuard có 4 case.
- UploadsService có 12 case.
- DTO có 56 case.

## validateEnv

### UT-001 Bảy key bắt buộc cùng thiếu

- Bước. Gọi validateEnv với {}.
- Expected. Ném Error. Message bắt đầu bằng Environment validation failed và chứa cả bảy key DATABASE_URL, REDIS_URL, MOMO_ENDPOINT, MOMO_REDIRECT_URL, MOMO_IPN_URL, CLOUDFLARE_R2_BUCKET_PUBLIC, CLOUDFLARE_R2_BUCKET_PRIVATE.

### UT-002 Thiếu riêng DATABASE_URL

- Bước. Gọi validateEnv với validEnv sau khi xóa DATABASE_URL.
- Expected. Ném Error. Message chứa Environment validation failed và chứa DATABASE_URL. Các key bắt buộc còn lại không nằm trong message.

### UT-003 DATABASE_URL là chuỗi rỗng

- Bước. Gọi validateEnv với validEnv và DATABASE_URL bằng "".
- Expected. Ném Error. Message chứa DATABASE_URL. Chuỗi rỗng không qua required.

### UT-004 Thiếu riêng REDIS_URL

- Bước. Gọi validateEnv với validEnv sau khi xóa REDIS_URL.
- Expected. Ném Error. Message chứa Environment validation failed và chứa REDIS_URL. Các key bắt buộc còn lại không nằm trong message.

### UT-005 REDIS_URL là chuỗi rỗng

- Bước. Gọi validateEnv với validEnv và REDIS_URL bằng "".
- Expected. Ném Error. Message chứa REDIS_URL. Chuỗi rỗng không qua required.

### UT-006 Thiếu riêng MOMO_ENDPOINT

- Bước. Gọi validateEnv với validEnv sau khi xóa MOMO_ENDPOINT.
- Expected. Ném Error. Message chứa Environment validation failed và chứa MOMO_ENDPOINT. Các key bắt buộc còn lại không nằm trong message.

### UT-007 MOMO_ENDPOINT là chuỗi rỗng

- Bước. Gọi validateEnv với validEnv và MOMO_ENDPOINT bằng "".
- Expected. Ném Error. Message chứa MOMO_ENDPOINT. Chuỗi rỗng không qua required.

### UT-008 Thiếu riêng MOMO_REDIRECT_URL

- Bước. Gọi validateEnv với validEnv sau khi xóa MOMO_REDIRECT_URL.
- Expected. Ném Error. Message chứa Environment validation failed và chứa MOMO_REDIRECT_URL. Các key bắt buộc còn lại không nằm trong message.

### UT-009 MOMO_REDIRECT_URL là chuỗi rỗng

- Bước. Gọi validateEnv với validEnv và MOMO_REDIRECT_URL bằng "".
- Expected. Ném Error. Message chứa MOMO_REDIRECT_URL. Chuỗi rỗng không qua required.

### UT-010 Thiếu riêng MOMO_IPN_URL

- Bước. Gọi validateEnv với validEnv sau khi xóa MOMO_IPN_URL.
- Expected. Ném Error. Message chứa Environment validation failed và chứa MOMO_IPN_URL. Các key bắt buộc còn lại không nằm trong message.

### UT-011 MOMO_IPN_URL là chuỗi rỗng

- Bước. Gọi validateEnv với validEnv và MOMO_IPN_URL bằng "".
- Expected. Ném Error. Message chứa MOMO_IPN_URL. Chuỗi rỗng không qua required.

### UT-012 Thiếu riêng CLOUDFLARE_R2_BUCKET_PUBLIC

- Bước. Gọi validateEnv với validEnv sau khi xóa CLOUDFLARE_R2_BUCKET_PUBLIC.
- Expected. Ném Error. Message chứa Environment validation failed và chứa CLOUDFLARE_R2_BUCKET_PUBLIC. Các key bắt buộc còn lại không nằm trong message.

### UT-013 CLOUDFLARE_R2_BUCKET_PUBLIC là chuỗi rỗng

- Bước. Gọi validateEnv với validEnv và CLOUDFLARE_R2_BUCKET_PUBLIC bằng "".
- Expected. Ném Error. Message chứa CLOUDFLARE_R2_BUCKET_PUBLIC. Chuỗi rỗng không qua required.

### UT-014 Thiếu riêng CLOUDFLARE_R2_BUCKET_PRIVATE

- Bước. Gọi validateEnv với validEnv sau khi xóa CLOUDFLARE_R2_BUCKET_PRIVATE.
- Expected. Ném Error. Message chứa Environment validation failed và chứa CLOUDFLARE_R2_BUCKET_PRIVATE. Các key bắt buộc còn lại không nằm trong message.

### UT-015 CLOUDFLARE_R2_BUCKET_PRIVATE là chuỗi rỗng

- Bước. Gọi validateEnv với validEnv và CLOUDFLARE_R2_BUCKET_PRIVATE bằng "".
- Expected. Ném Error. Message chứa CLOUDFLARE_R2_BUCKET_PRIVATE. Chuỗi rỗng không qua required.

### UT-016 NODE_ENV development hợp lệ

- Bước. Gọi validateEnv với validEnv và NODE_ENV bằng development.
- Expected. Không ném. result.NODE_ENV bằng development.

### UT-017 NODE_ENV test hợp lệ

- Bước. Gọi validateEnv với validEnv và NODE_ENV bằng test.
- Expected. Không ném. result.NODE_ENV bằng test.

### UT-018 NODE_ENV production cần secret thật

- Bước. Gọi validateEnv với validEnv và NODE_ENV bằng production.
- Expected. Không ném. result.NODE_ENV bằng production.

### UT-019 NODE_ENV không hợp lệ "staging"

- Bước. Gọi validateEnv với validEnv và NODE_ENV bằng "staging".
- Expected. Ném Error. Message chứa NODE_ENV.

### UT-020 NODE_ENV không hợp lệ ""

- Bước. Gọi validateEnv với validEnv và NODE_ENV bằng "".
- Expected. Ném Error. Message chứa NODE_ENV.

### UT-021 NODE_ENV không hợp lệ "1"

- Bước. Gọi validateEnv với validEnv và NODE_ENV bằng "1".
- Expected. Ném Error. Message chứa NODE_ENV.

### UT-022 NODE_ENV bị bỏ qua

- Bước. Gọi validateEnv với validEnv, không gửi NODE_ENV.
- Expected. Không ném. result.NODE_ENV bằng development.

### UT-023 PORT 1 hợp lệ

- Bước. Gọi validateEnv với validEnv và PORT bằng 1.
- Expected. Không ném. result.PORT bằng 1.

### UT-024 PORT 80 hợp lệ

- Bước. Gọi validateEnv với validEnv và PORT bằng 80.
- Expected. Không ném. result.PORT bằng 80.

### UT-025 PORT 3000 hợp lệ

- Bước. Gọi validateEnv với validEnv và PORT bằng 3000.
- Expected. Không ném. result.PORT bằng 3000.

### UT-026 PORT 65535 hợp lệ

- Bước. Gọi validateEnv với validEnv và PORT bằng 65535.
- Expected. Không ném. result.PORT bằng 65535.

### UT-027 PORT không hợp lệ -1

- Bước. Gọi validateEnv với validEnv và PORT bằng -1.
- Expected. Ném Error. Message chứa PORT.

### UT-028 PORT không hợp lệ 65536

- Bước. Gọi validateEnv với validEnv và PORT bằng 65536.
- Expected. Ném Error. Message chứa PORT.

### UT-029 PORT không hợp lệ 70000

- Bước. Gọi validateEnv với validEnv và PORT bằng 70000.
- Expected. Ném Error. Message chứa PORT.

### UT-030 PORT không hợp lệ "abc"

- Bước. Gọi validateEnv với validEnv và PORT bằng "abc".
- Expected. Ném Error. Message chứa PORT.

### UT-031 PORT bị bỏ qua

- Bước. Gọi validateEnv với validEnv, không gửi PORT.
- Expected. Không ném. result.PORT bằng 3000.

### UT-032 LOG_LEVEL fatal hợp lệ

- Bước. Gọi validateEnv với validEnv và LOG_LEVEL bằng fatal.
- Expected. Không ném. result.LOG_LEVEL bằng fatal.

### UT-033 LOG_LEVEL error hợp lệ

- Bước. Gọi validateEnv với validEnv và LOG_LEVEL bằng error.
- Expected. Không ném. result.LOG_LEVEL bằng error.

### UT-034 LOG_LEVEL warn hợp lệ

- Bước. Gọi validateEnv với validEnv và LOG_LEVEL bằng warn.
- Expected. Không ném. result.LOG_LEVEL bằng warn.

### UT-035 LOG_LEVEL info hợp lệ

- Bước. Gọi validateEnv với validEnv và LOG_LEVEL bằng info.
- Expected. Không ném. result.LOG_LEVEL bằng info.

### UT-036 LOG_LEVEL debug hợp lệ

- Bước. Gọi validateEnv với validEnv và LOG_LEVEL bằng debug.
- Expected. Không ném. result.LOG_LEVEL bằng debug.

### UT-037 LOG_LEVEL trace hợp lệ

- Bước. Gọi validateEnv với validEnv và LOG_LEVEL bằng trace.
- Expected. Không ném. result.LOG_LEVEL bằng trace.

### UT-038 LOG_LEVEL không hợp lệ "verbose"

- Bước. Gọi validateEnv với validEnv và LOG_LEVEL bằng "verbose".
- Expected. Ném Error. Message chứa LOG_LEVEL. Schema không lowercase giá trị này.

### UT-039 LOG_LEVEL không hợp lệ ""

- Bước. Gọi validateEnv với validEnv và LOG_LEVEL bằng "".
- Expected. Ném Error. Message chứa LOG_LEVEL. Schema không lowercase giá trị này.

### UT-040 LOG_LEVEL không hợp lệ "INFO"

- Bước. Gọi validateEnv với validEnv và LOG_LEVEL bằng "INFO".
- Expected. Ném Error. Message chứa LOG_LEVEL. Schema không lowercase giá trị này.

### UT-041 LOG_LEVEL bị bỏ qua

- Bước. Gọi validateEnv với validEnv, không gửi LOG_LEVEL.
- Expected. Không ném. result.LOG_LEVEL bằng info.

### UT-042 JWT_ACCESS_SECRET dài 15 ký tự

- Bước. Gọi validateEnv với validEnv và JWT_ACCESS_SECRET bằng chuỗi 15 ký tự a.
- Expected. Ném Error. Message chứa JWT_ACCESS_SECRET. Min là 16.

### UT-043 JWT_ACCESS_SECRET dài 16 ký tự

- Bước. Gọi validateEnv với validEnv và JWT_ACCESS_SECRET bằng chuỗi 16 ký tự a.
- Expected. Không ném. result.JWT_ACCESS_SECRET bằng chuỗi vừa gửi.

### UT-044 JWT_REFRESH_SECRET dài 15 ký tự

- Bước. Gọi validateEnv với validEnv và JWT_REFRESH_SECRET bằng chuỗi 15 ký tự a.
- Expected. Ném Error. Message chứa JWT_REFRESH_SECRET. Min là 16.

### UT-045 JWT_REFRESH_SECRET dài 16 ký tự

- Bước. Gọi validateEnv với validEnv và JWT_REFRESH_SECRET bằng chuỗi 16 ký tự a.
- Expected. Không ném. result.JWT_REFRESH_SECRET bằng chuỗi vừa gửi.

### UT-046 OPS_API_KEY dài 15 ký tự

- Bước. Gọi validateEnv với validEnv và OPS_API_KEY bằng chuỗi 15 ký tự a.
- Expected. Ném Error. Message chứa OPS_API_KEY. Min là 16.

### UT-047 OPS_API_KEY dài 16 ký tự

- Bước. Gọi validateEnv với validEnv và OPS_API_KEY bằng chuỗi 16 ký tự a.
- Expected. Không ném. result.OPS_API_KEY bằng chuỗi vừa gửi.

### UT-048 JWT_ACCESS_SECRET bị bỏ qua

- Bước. Gọi validateEnv với validEnv, không gửi JWT_ACCESS_SECRET.
- Expected. Không ném. result.JWT_ACCESS_SECRET bằng development-access-secret.

### UT-049 JWT_REFRESH_SECRET bị bỏ qua

- Bước. Gọi validateEnv với validEnv, không gửi JWT_REFRESH_SECRET.
- Expected. Không ném. result.JWT_REFRESH_SECRET bằng development-refresh-secret.

### UT-050 OPS_API_KEY bị bỏ qua

- Bước. Gọi validateEnv với validEnv, không gửi OPS_API_KEY.
- Expected. Không ném. result.OPS_API_KEY bằng local-operations-key-change-me.

### UT-051 JWT_ACCESS_TTL_SECONDS bằng 0

- Bước. Gọi validateEnv với validEnv và JWT_ACCESS_TTL_SECONDS bằng 0.
- Expected. Ném Error. Message chứa JWT_ACCESS_TTL_SECONDS. Schema yêu cầu integer dương.

### UT-052 JWT_ACCESS_TTL_SECONDS bằng -1

- Bước. Gọi validateEnv với validEnv và JWT_ACCESS_TTL_SECONDS bằng -1.
- Expected. Ném Error. Message chứa JWT_ACCESS_TTL_SECONDS. Schema yêu cầu integer dương.

### UT-053 JWT_REFRESH_TTL_SECONDS bằng 0

- Bước. Gọi validateEnv với validEnv và JWT_REFRESH_TTL_SECONDS bằng 0.
- Expected. Ném Error. Message chứa JWT_REFRESH_TTL_SECONDS. Schema yêu cầu integer dương.

### UT-054 JWT_REFRESH_TTL_SECONDS bằng -5

- Bước. Gọi validateEnv với validEnv và JWT_REFRESH_TTL_SECONDS bằng -5.
- Expected. Ném Error. Message chứa JWT_REFRESH_TTL_SECONDS. Schema yêu cầu integer dương.

### UT-055 JWT_ACCESS_TTL_SECONDS bằng 1

- Bước. Gọi validateEnv với validEnv và JWT_ACCESS_TTL_SECONDS bằng 1.
- Expected. Không ném. result.JWT_ACCESS_TTL_SECONDS bằng 1.

### UT-056 JWT_ACCESS_TTL_SECONDS bị bỏ qua

- Bước. Gọi validateEnv với validEnv, không gửi JWT_ACCESS_TTL_SECONDS.
- Expected. Không ném. result.JWT_ACCESS_TTL_SECONDS bằng 900.

### UT-057 JWT_REFRESH_TTL_SECONDS bị bỏ qua

- Bước. Gọi validateEnv với validEnv, không gửi JWT_REFRESH_TTL_SECONDS.
- Expected. Không ném. result.JWT_REFRESH_TTL_SECONDS bằng 2592000.

### UT-058 REDIS_URL là URI hợp lệ

- Bước. Gọi validateEnv với validEnv và REDIS_URL bằng localhost:6379.
- Expected. Ném Error. Message chứa REDIS_URL.

### UT-059 WEB_URL là URI hợp lệ

- Bước. Gọi validateEnv với validEnv và MOMO_ENDPOINT bằng localhost:6379.
- Expected. Ném Error. Message chứa MOMO_ENDPOINT.

### UT-060 DATABASE_URL rỗng bị từ chối

- Bước. Gọi validateEnv với validEnv và MOMO_REDIRECT_URL bằng localhost:6379.
- Expected. Ném Error. Message chứa MOMO_REDIRECT_URL.

### UT-061 REDIS_URL rỗng bị từ chối

- Bước. Gọi validateEnv với validEnv và MOMO_IPN_URL bằng localhost:6379.
- Expected. Ném Error. Message chứa MOMO_IPN_URL.

### UT-062 WEB_URL rỗng bị từ chối

- Bước. Gọi validateEnv với validEnv và WEB_URL bằng localhost:6379.
- Expected. Ném Error. Message chứa WEB_URL.

### UT-063 CLOUDFLARE_R2_BUCKET_PUBLIC rỗng bị từ chối

- Bước. Gọi validateEnv với validEnv và MOMO_QUERY_ENDPOINT bằng localhost:6379.
- Expected. Ném Error. Message chứa MOMO_QUERY_ENDPOINT.

### UT-064 CLOUDFLARE_R2_BUCKET_PRIVATE rỗng bị từ chối

- Bước. Gọi validateEnv với validEnv và MOMO_REFUND_ENDPOINT bằng localhost:6379.
- Expected. Ném Error. Message chứa MOMO_REFUND_ENDPOINT.

### UT-065 WEB_URL bị bỏ qua

- Bước. Gọi validateEnv với validEnv, không gửi WEB_URL.
- Expected. Không ném. result.WEB_URL bằng http://localhost:5173.

### UT-066 CLOUDFLARE_ACCOUNT_ID chuỗi rỗng được phép

- Bước. Gọi validateEnv với validEnv và MOMO_PARTNER_CODE bằng "".
- Expected. Không ném. result.MOMO_PARTNER_CODE bằng chuỗi rỗng.

### UT-067 CLOUDFLARE_R2_ACCESS_KEY_ID chuỗi rỗng được phép

- Bước. Gọi validateEnv với validEnv và MOMO_ACCESS_KEY bằng "".
- Expected. Không ném. result.MOMO_ACCESS_KEY bằng chuỗi rỗng.

### UT-068 CLOUDFLARE_R2_SECRET_ACCESS_KEY chuỗi rỗng được phép

- Bước. Gọi validateEnv với validEnv và MOMO_SECRET_KEY bằng "".
- Expected. Không ném. result.MOMO_SECRET_KEY bằng chuỗi rỗng.

### UT-069 CLOUDFLARE_R2_PUBLIC_URL chuỗi rỗng được phép

- Bước. Gọi validateEnv với validEnv và CLOUDFLARE_ACCOUNT_ID bằng "".
- Expected. Không ném. result.CLOUDFLARE_ACCOUNT_ID bằng chuỗi rỗng.

### UT-070 JWT_ACCESS_SECRET mặc định ở development

- Bước. Gọi validateEnv với validEnv và CLOUDFLARE_R2_ACCESS_KEY_ID bằng "".
- Expected. Không ném. result.CLOUDFLARE_R2_ACCESS_KEY_ID bằng chuỗi rỗng.

### UT-071 production từ chối JWT_ACCESS_SECRET mặc định

- Bước. Gọi validateEnv với validEnv và CLOUDFLARE_R2_SECRET_ACCESS_KEY bằng "".
- Expected. Không ném. result.CLOUDFLARE_R2_SECRET_ACCESS_KEY bằng chuỗi rỗng.

### UT-072 production từ chối OPS_API_KEY mặc định

- Bước. Gọi validateEnv với validEnv và CLOUDFLARE_R2_PUBLIC_URL bằng "".
- Expected. Không ném. result.CLOUDFLARE_R2_PUBLIC_URL bằng chuỗi rỗng.

### UT-073 Key lạ được giữ

- Bước. Gọi validateEnv với validEnv và EXTRA bằng kept.
- Expected. Không ném. result.EXTRA bằng kept. allowUnknown là true và stripUnknown là false.

### UT-074 Không boot ConfigModule

- Bước. Spec chỉ gọi validateEnv. Không import AppModule.
- Expected. Không có kết nối Prisma và không đọc file .env.

## ResponseInterceptor

### UT-075 Bọc payload object

- Bước. new ResponseInterceptor(). Request url là /api/health/live. handle() trả { status: 'ok' }.
- Expected. Object phát ra có success bằng true, data bằng { status: 'ok' }, path bằng /api/health/live. Date.parse(timestamp) không phải NaN.

### UT-076 Bọc payload null

- Bước. new ResponseInterceptor(). Request url là /api/health/live. handle() trả of(null).
- Expected. Object phát ra có success bằng true, data bằng null, path bằng /api/health/live. Date.parse(timestamp) không phải NaN.

### UT-077 Bọc payload undefined

- Bước. new ResponseInterceptor(). Request url là /api/health/live. handle() trả of(undefined).
- Expected. Object phát ra có success bằng true, data bằng undefined, path bằng /api/health/live. Date.parse(timestamp) không phải NaN.

### UT-078 Bọc payload số 0

- Bước. new ResponseInterceptor(). Request url là /api/health/live. handle() trả of(0).
- Expected. Object phát ra có success bằng true, data bằng 0, path bằng /api/health/live. Date.parse(timestamp) không phải NaN.

### UT-079 Bọc payload false

- Bước. new ResponseInterceptor(). Request url là /api/health/live. handle() trả of(false).
- Expected. Object phát ra có success bằng true, data bằng false, path bằng /api/health/live. Date.parse(timestamp) không phải NaN.

### UT-080 Bọc payload chuỗi rỗng

- Bước. new ResponseInterceptor(). Request url là /api/health/live. handle() trả of('').
- Expected. Object phát ra có success bằng true, data bằng '', path bằng /api/health/live. Date.parse(timestamp) không phải NaN.

### UT-081 Bọc payload mảng rỗng

- Bước. new ResponseInterceptor(). Request url là /api/health/live. handle() trả of([]).
- Expected. Object phát ra có success bằng true, data bằng [], path bằng /api/health/live. Date.parse(timestamp) không phải NaN.

### UT-082 Bọc payload mảng một phần tử

- Bước. new ResponseInterceptor(). Request url là /api/health/live. handle() trả of([1]).
- Expected. Object phát ra có success bằng true, data bằng [1], path bằng /api/health/live. Date.parse(timestamp) không phải NaN.

### UT-083 Bọc payload số 12

- Bước. new ResponseInterceptor(). Request url là /api/health/live. handle() trả of(12).
- Expected. Object phát ra có success bằng true, data bằng 12, path bằng /api/health/live. Date.parse(timestamp) không phải NaN.

### UT-084 Bọc payload object lồng

- Bước. new ResponseInterceptor(). Request url là /api/health/live. handle() trả of({ a: { b: 1 } }).
- Expected. Object phát ra có success bằng true, data bằng { a: { b: 1 } }, path bằng /api/health/live. Date.parse(timestamp) không phải NaN.

### UT-085 Path /api/products

- Bước. Request url là "/api/products". handle() trả of({ ok: true }).
- Expected. path trong envelope bằng "/api/products". data bằng { ok: true }. success bằng true.

### UT-086 Path /api/cart

- Bước. Request url là "/api/cart". handle() trả of({ ok: true }).
- Expected. path trong envelope bằng "/api/cart". data bằng { ok: true }. success bằng true.

### UT-087 Path /api/orders

- Bước. Request url là "/api/orders". handle() trả of({ ok: true }).
- Expected. path trong envelope bằng "/api/orders". data bằng { ok: true }. success bằng true.

### UT-088 Path /

- Bước. Request url là "/". handle() trả of({ ok: true }).
- Expected. path trong envelope bằng "/". data bằng { ok: true }. success bằng true.

### UT-089 Path rỗng

- Bước. Request url là "". handle() trả of({ ok: true }).
- Expected. path trong envelope bằng "". data bằng { ok: true }. success bằng true.

## AllExceptionsFilter

### UT-090 HttpException string status 400

- Bước. new AllExceptionsFilter với logger.error là vi.fn(). Request method GET, url /api/health/live. catch(new HttpException('nope', 400), host).
- Expected. response.status nhận 400. Body có success false, error.statusCode 400, error.message nope, path /api/health/live. logger.error được gọi một lần.

### UT-091 HttpException string status 401

- Bước. new AllExceptionsFilter với logger.error là vi.fn(). Request method GET, url /api/health/live. catch(new HttpException('nope', 401), host).
- Expected. response.status nhận 401. Body có success false, error.statusCode 401, error.message nope, path /api/health/live. logger.error được gọi một lần.

### UT-092 HttpException string status 403

- Bước. new AllExceptionsFilter với logger.error là vi.fn(). Request method GET, url /api/health/live. catch(new HttpException('nope', 403), host).
- Expected. response.status nhận 403. Body có success false, error.statusCode 403, error.message nope, path /api/health/live. logger.error được gọi một lần.

### UT-093 HttpException string status 404

- Bước. new AllExceptionsFilter với logger.error là vi.fn(). Request method GET, url /api/health/live. catch(new HttpException('nope', 404), host).
- Expected. response.status nhận 404. Body có success false, error.statusCode 404, error.message nope, path /api/health/live. logger.error được gọi một lần.

### UT-094 HttpException string status 409

- Bước. new AllExceptionsFilter với logger.error là vi.fn(). Request method GET, url /api/health/live. catch(new HttpException('nope', 409), host).
- Expected. response.status nhận 409. Body có success false, error.statusCode 409, error.message nope, path /api/health/live. logger.error được gọi một lần.

### UT-095 HttpException string status 422

- Bước. new AllExceptionsFilter với logger.error là vi.fn(). Request method GET, url /api/health/live. catch(new HttpException('nope', 422), host).
- Expected. response.status nhận 422. Body có success false, error.statusCode 422, error.message nope, path /api/health/live. logger.error được gọi một lần.

### UT-096 HttpException string status 429

- Bước. new AllExceptionsFilter với logger.error là vi.fn(). Request method GET, url /api/health/live. catch(new HttpException('nope', 429), host).
- Expected. response.status nhận 429. Body có success false, error.statusCode 429, error.message nope, path /api/health/live. logger.error được gọi một lần.

### UT-097 HttpException string status 500

- Bước. new AllExceptionsFilter với logger.error là vi.fn(). Request method GET, url /api/health/live. catch(new HttpException('nope', 500), host).
- Expected. response.status nhận 500. Body có success false, error.statusCode 500, error.message nope, path /api/health/live. logger.error được gọi một lần.

### UT-098 Message là mảng

- Bước. catch(new HttpException({ message: ['a', 'b'] }, 400), host).
- Expected. error.message bằng ['a', 'b']. status 400. success false.

### UT-099 Message object là string

- Bước. catch(new HttpException({ message: 'bad field' }, 422), host).
- Expected. error.message bằng bad field. status 422.

### UT-100 Object không có message

- Bước. catch(new HttpException({ error: 'x' }, 400), host). HttpException tự có message mặc định.
- Expected. status 400. error.message là string, không phải object { error: 'x' }.

### UT-101 Error thường

- Bước. catch(new Error('db down'), host).
- Expected. status 500. error.message bằng db down. success false.

### UT-102 Giá trị không phải Error

- Bước. catch('boom', host).
- Expected. status 500. error.message bằng Internal server error.

### UT-103 null

- Bước. catch(null, host).
- Expected. status 500. error.message bằng Internal server error.

### UT-104 Không boot app

- Bước. Spec tự tạo filter. Không gọi bootstrap.
- Expected. Test không chứng minh useGlobalFilters trong main.ts.

## HealthController

### UT-105 live không đụng database

- Bước. new HealthController với health.check và prisma.$queryRaw là vi.fn(). Gọi live().
- Expected. Trả { status: 'ok', service: 'ecommerce-api' }. $queryRaw không được gọi. health.check không được gọi.

### UT-106 ready khi SELECT 1 thành công

- Bước. Mock health.check để gọi indicator đầu tiên. $queryRaw resolve 1. Gọi check().
- Expected. Indicator trả { database: { status: 'up' } }. $queryRaw được gọi một lần.

### UT-107 ready khi SELECT 1 thất bại

- Bước. Mock health.check để gọi indicator đầu tiên. $queryRaw reject Error('down'). Gọi check().
- Expected. Promise của check() reject. Không trả status up.

### UT-108 Không giả kết quả check

- Bước. Không mock health.check trả sẵn { database: { status: 'up' } }.
- Expected. Nếu closure không gọi $queryRaw thì case ready thành công phải đỏ.

## pinoRedactPaths

### UT-109 Đúng bốn path theo thứ tự

- Bước. Export pinoRedactPaths từ app.module.ts và truyền chính constant đó vào LoggerModule.forRoot. Spec import constant đó.
- Expected. Mảng bằng ["req.headers.authorization","req.headers.cookie","*.password","*.secretKey"].

### UT-110 Không có key tên secret

- Bước. Đọc pinoRedactPaths.
- Expected. Không chứa secret và không chứa MOMO_SECRET_KEY. *.secretKey chỉ khớp field tên secretKey.

### UT-111 Giữ *.password

- Bước. Đọc pinoRedactPaths.
- Expected. Có *.password. Bỏ path này sẽ log password.

## RolesGuard

### UT-112 Không có metadata role

- Bước. reflector.getAllAndOverride trả undefined. Gọi canActivate.
- Expected. Trả true. Không đọc request.user.

### UT-113 Mảng role rỗng

- Bước. reflector.getAllAndOverride trả []. Gọi canActivate.
- Expected. Trả true vì !roles.length.

### UT-114 BUYER vào route BUYER

- Bước. roles là [BUYER]. request.user.role là BUYER.
- Expected. Trả true.

### UT-115 BUYER vào route SELLER

- Bước. roles là [SELLER]. request.user.role là BUYER.
- Expected. Trả false.

### UT-116 SELLER vào route có cả hai role

- Bước. roles là [BUYER, SELLER]. request.user.role là SELLER.
- Expected. Trả true.

### UT-117 Không có user

- Bước. roles là [BUYER]. request.user là undefined.
- Expected. Ném TypeError khi đọc request.user.role. Đây là lỗ hổng của guard, test phải đỏ nếu ai nuốt lỗi thành false.

## JwtStrategy

### UT-118 Token không phải access

- Bước. validate({ sub: 'u1', type: 'refresh' }).
- Expected. Ném UnauthorizedException.

### UT-119 User không tồn tại

- Bước. payload type access. prisma.user.findUnique trả null.
- Expected. Ném UnauthorizedException.

### UT-120 User SUSPENDED

- Bước. findUnique trả user status SUSPENDED.
- Expected. Ném UnauthorizedException.

### UT-121 User ACTIVE

- Bước. findUnique trả { id, email, role: BUYER, status: ACTIVE }.
- Expected. Trả { id, email, role: BUYER }. Không trả passwordHash.

## AuthService

### UT-122 register hạ và trim email

- Bước. prisma.user.findUnique trả null. dto.email là '  Buyer@Example.com '. dto.name là '  An '. role BUYER.
- Expected. findUnique where.email bằng buyer@example.com. user.create data.email bằng buyer@example.com, name bằng An sau trim, role BUYER. passwordHash là kết quả hash, không phải password thô.

### UT-123 register email đã có

- Bước. findUnique trả một user.
- Expected. Ném ConflictException message Email is already registered. user.create không được gọi.

### UT-124 register seller

- Bước. findUnique trả null. role SELLER.
- Expected. user.create data.role bằng SELLER.

### UT-125 login email không tồn tại

- Bước. findUnique trả null.
- Expected. Ném UnauthorizedException message Invalid email or password. compare không cần được gọi.

### UT-126 login sai mật khẩu

- Bước. findUnique trả user. compare trả false.
- Expected. Ném UnauthorizedException message Invalid email or password.

### UT-127 login tài khoản SUSPENDED

- Bước. findUnique trả user status SUSPENDED. compare trả true.
- Expected. Ném UnauthorizedException message Account is suspended. Không tạo refresh token.

### UT-128 login thành công

- Bước. User ACTIVE. compare trả true. jwt.signAsync trả access rồi refresh.
- Expected. Trả accessToken, refreshToken, và user không có passwordHash. refreshToken.create nhận tokenHash là sha256 hex của refresh token.

### UT-129 login hạ email

- Bước. dto.email là '  A@B.COM '.
- Expected. findUnique where.email bằng a@b.com.

### UT-130 refresh jwt.verifyAsync ném

- Bước. jwt.verifyAsync reject.
- Expected. Ném UnauthorizedException message Invalid refresh token.

### UT-131 refresh payload.type là access

- Bước. jwt.verifyAsync trả payload type access.
- Expected. Ném UnauthorizedException message Invalid refresh token.

### UT-132 refresh stored null

- Bước. verifyAsync trả type refresh. refreshToken.findUnique trả null.
- Expected. Ném UnauthorizedException message Refresh token is expired or revoked.

### UT-133 refresh revokedAt có giá trị

- Bước. findUnique trả bản ghi revokedAt khác null.
- Expected. Ném UnauthorizedException message Refresh token is expired or revoked.

### UT-134 refresh expiresAt đã qua

- Bước. findUnique trả expiresAt nhỏ hơn now.
- Expected. Ném UnauthorizedException message Refresh token is expired or revoked.

### UT-135 refresh user SUSPENDED

- Bước. Token còn hạn, chưa revoke. user.status là SUSPENDED.
- Expected. Ném UnauthorizedException message Account is suspended. Không revoke token cũ.

### UT-136 refresh xoay token

- Bước. Token hợp lệ, user ACTIVE.
- Expected. Token cũ được set revokedAt. Trả session mới. createSession được gọi với stored.user.

### UT-137 logout token lạ

- Bước. updateMany trả count 0.
- Expected. Vẫn trả { success: true }. where gồm tokenHash và revokedAt null.

### UT-138 logout token đang sống

- Bước. updateMany match một dòng.
- Expected. data.revokedAt là Date. Trả { success: true }.

### UT-139 public user không lộ hash

- Bước. Đọc object user trong kết quả login thành công.
- Expected. Có id, email, name, phone, avatarUrl, role, status. Không có passwordHash.

## AuthController

### UT-140 register dùng name khi có name

- Bước. dto có name An, fullName Khác, role BUYER, storeName Shop.
- Expected. auth.register nhận name An và role BUYER. storeName không được gửi xuống service.

### UT-141 register dùng fullName khi thiếu name

- Bước. dto không có name. fullName là An. role SELLER.
- Expected. auth.register nhận name An và role SELLER.

### UT-142 register/buyer ép BUYER

- Bước. Gọi registerBuyer với RegisterDto.
- Expected. auth.register nhận UserRole.BUYER dù body không có role.

### UT-143 register/seller ép SELLER

- Bước. Gọi registerSeller với RegisterDto.
- Expected. auth.register nhận UserRole.SELLER.

### UT-144 login chuyển nguyên dto

- Bước. Gọi login(dto).
- Expected. auth.login nhận đúng dto. Controller không tự hash.

### UT-145 refresh chỉ gửi refreshToken

- Bước. dto.refreshToken là raw.
- Expected. auth.refresh nhận raw, không nhận cả dto.

### UT-146 logout chỉ gửi refreshToken

- Bước. dto.refreshToken là raw.
- Expected. auth.logout nhận raw.

## UsersService

### UT-147 profile không trả hash

- Bước. Gọi profile('u1').
- Expected. findUniqueOrThrow select không có passwordHash. where.id bằng u1.

### UT-148 updateProfile chỉ update field dto

- Bước. Gọi updateProfile('u1', { name: 'An' }).
- Expected. user.update where.id u1, data bằng { name: 'An' }, select không có passwordHash.

### UT-149 addresses của đúng user

- Bước. Gọi addresses('u1').
- Expected. findMany where.userId u1, orderBy createdAt desc.

### UT-150 địa chỉ đầu tiên thành default

- Bước. address.count trả 0. dto.isDefault là false.
- Expected. address.create data.isDefault bằng true. updateMany set isDefault false được gọi trước create.

### UT-151 địa chỉ sau không tự default

- Bước. count trả 2. dto.isDefault là false.
- Expected. create data.isDefault bằng false. updateMany không được gọi.

### UT-152 isDefault true gỡ default cũ

- Bước. count trả 2. dto.isDefault là true.
- Expected. updateMany where.userId set isDefault false, rồi create isDefault true.

### UT-153 update địa chỉ không thuộc user

- Bước. address.findFirst trả null.
- Expected. Ném NotFoundException message Address not found. address.update không được gọi.

### UT-154 update đặt default

- Bước. findFirst trả address. dto.isDefault true.
- Expected. updateMany where userId và id khác id hiện tại set isDefault false. Sau đó update đúng id.

### UT-155 update không đụng default

- Bước. dto không có isDefault.
- Expected. updateMany không được gọi. address.update data là dto.

### UT-156 xóa địa chỉ không thuộc user

- Bước. findFirst trả null.
- Expected. Ném NotFoundException message Address not found. delete không được gọi.

### UT-157 xóa địa chỉ không phải default

- Bước. findFirst trả isDefault false.
- Expected. delete được gọi. Không promote địa chỉ khác. Trả { success: true }.

### UT-158 xóa default còn địa chỉ khác

- Bước. findFirst trả isDefault true. findFirst sau delete trả address b2.
- Expected. b2 được update isDefault true. Trả { success: true }.

### UT-159 xóa default là địa chỉ cuối

- Bước. isDefault true. findFirst sau delete trả null.
- Expected. Không gọi update. Trả { success: true }.

## slugify

### UT-160 Slug của "Áo Dài Việt"

- Bước. Tạo store hoặc category với name "Áo Dài Việt". Spy hàm tìm slug, lần đầu trả null.
- Expected. Slug ghi xuống create bằng ao-dai-viet.

### UT-161 Slug của "  Cà phê  "

- Bước. Tạo store hoặc category với name "  Cà phê  ". Spy hàm tìm slug, lần đầu trả null.
- Expected. Slug ghi xuống create bằng ca-phe.

### UT-162 Slug của "Hello World"

- Bước. Tạo store hoặc category với name "Hello World". Spy hàm tìm slug, lần đầu trả null.
- Expected. Slug ghi xuống create bằng hello-world.

### UT-163 Slug của "SKU-01"

- Bước. Tạo store hoặc category với name "SKU-01". Spy hàm tìm slug, lần đầu trả null.
- Expected. Slug ghi xuống create bằng sku-01.

### UT-164 Slug của "!!!"

- Bước. Tạo store hoặc category với name "!!!". Spy hàm tìm slug, lần đầu trả null.
- Expected. slugify ra chuỗi rỗng nên uniqueSlug dùng base item. Slug ghi xuống create bằng item.

### UT-165 Slug của "Điện tử"

- Bước. Tạo store hoặc category với name "Điện tử". Spy hàm tìm slug, lần đầu trả null.
- Expected. Slug ghi xuống create bằng dien-tu.

### UT-166 Slug đã tồn tại được thêm hậu tố

- Bước. uniqueSlug thấy slug ao-dai đã có, lần ao-dai-1 trả null.
- Expected. Slug ghi xuống create bằng ao-dai-1.

### UT-167 Hai lần trùng tăng tiếp

- Bước. ao-dai và ao-dai-1 đều đã có. ao-dai-2 chưa có.
- Expected. Slug ghi xuống create bằng ao-dai-2.

## SellerCatalogService

### UT-168 createStore khi đã có store

- Bước. store.findUnique theo sellerId trả một store.
- Expected. Ném ConflictException message Seller already has a store. store.create không được gọi.

### UT-169 createStore lần đầu

- Bước. findUnique trả null. name là Áo Dài.
- Expected. store.create data.sellerId đúng user, name đúng dto, slug là ao-dai.

### UT-170 getStore không ném khi chưa có

- Bước. findUnique trả null.
- Expected. Trả null. Không ném NotFoundException. requireStore mới ném.

### UT-171 updateStore khi chưa có store

- Bước. requireStore không thấy store.
- Expected. Ném NotFoundException message Store not found.

### UT-172 createCategory parent không có

- Bước. parentId là p1. category.findUnique trả null.
- Expected. Ném NotFoundException message Parent category not found.

### UT-173 createCategory không parent

- Bước. Không gửi parentId. unique slug trả ca-phe.
- Expected. category.create data.parentId là undefined, slug ca-phe, name đúng dto.

### UT-174 listProducts chưa có store

- Bước. store.findUnique trả null.
- Expected. Ném NotFoundException message Store not found.

### UT-175 listProducts đúng store

- Bước. store id là s1.
- Expected. product.findMany where.storeId s1, orderBy createdAt desc, include images category store.

### UT-176 createProduct SKU trùng

- Bước. product.findUnique theo sku trả một product.
- Expected. Ném ConflictException message SKU already exists.

### UT-177 createProduct stock mặc định 0

- Bước. dto không có stock và status. SKU chưa có.
- Expected. stock bằng 0, status DRAFT. Không tạo inventoryTransaction INITIAL.

### UT-178 createProduct stock dương

- Bước. dto.stock là 5, status bỏ trống.
- Expected. status DRAFT. inventoryTransaction type INITIAL, quantity 5, before 0, after 5, reason Initial stock.

### UT-179 createProduct ACTIVE nhưng stock 0

- Bước. dto.status ACTIVE, stock 0.
- Expected. normalizedStatus đổi status thành OUT_OF_STOCK.

### UT-180 createProduct OUT_OF_STOCK nhưng stock dương

- Bước. dto.status OUT_OF_STOCK, stock 3.
- Expected. normalizedStatus đổi status thành ACTIVE.

### UT-181 updateProduct đổi stock

- Bước. dto.stock khác product.stock.
- Expected. Ném BadRequestException message Use the inventory adjustment endpoint to change stock. product.update không được gọi.

### UT-182 updateProduct giữ nguyên stock

- Bước. dto.stock bằng product.stock, price là 1000.
- Expected. product.update được gọi. price là Decimal 1000.

### UT-183 updateProduct không thuộc seller

- Bước. product.findFirst trả null.
- Expected. Ném NotFoundException message Product not found.

### UT-184 adjustInventory không thuộc seller

- Bước. findFirst trong transaction trả null.
- Expected. Ném NotFoundException message Product not found.

### UT-185 adjustInventory âm quá tồn

- Bước. stock 2, quantity -3.
- Expected. Ném BadRequestException message Insufficient stock. product.update không được gọi.

### UT-186 adjustInventory về 0 từ ACTIVE

- Bước. stock 2, status ACTIVE, quantity -2.
- Expected. stock sau update bằng 0, status OUT_OF_STOCK. inventoryTransaction type ADJUSTMENT, before 2, after 0, quantity -2.

### UT-187 adjustInventory từ OUT_OF_STOCK lên dương

- Bước. stock 0, status OUT_OF_STOCK, quantity 4.
- Expected. stock 4, status ACTIVE.

### UT-188 adjustInventory DRAFT không bị đổi status

- Bước. stock 1, status DRAFT, quantity 2.
- Expected. stock 3, status vẫn DRAFT.

### UT-189 removeProduct

- Bước. product thuộc seller.
- Expected. product.delete where id. Trả { deleted: true }.

### UT-190 inventoryHistory không thuộc seller

- Bước. requireOwnedProduct không thấy product.
- Expected. Ném NotFoundException message Product not found. findMany không được gọi.

## CatalogService

### UT-191 categories chỉ lấy gốc

- Bước. Gọi categories().
- Expected. findMany where.parentId null, include children, orderBy name asc.

### UT-192 products không lọc khi query rỗng

- Bước. query là {}.
- Expected. where chỉ có status ACTIVE. Không có name contains, không có category, không có store.

### UT-193 products search

- Bước. query.search là ao.
- Expected. where.name.contains bằng ao, mode insensitive, status ACTIVE.

### UT-194 products category và store

- Bước. query.category là ao-dai, query.store là shop-a.
- Expected. where.category.slug ao-dai và where.store.slug shop-a, status ACTIVE.

### UT-195 product slug không có hoặc không ACTIVE

- Bước. findFirst trả null.
- Expected. Ném NotFoundException message Product not found.

### UT-196 product slug ACTIVE

- Bước. findFirst trả product.
- Expected. Trả product đó. where gồm slug và status ACTIVE.

## CartService

### UT-197 get tạo cart nếu chưa có

- Bước. Gọi get('u1').
- Expected. cart.upsert where.userId u1, create { userId: u1 }, include items theo createdAt asc.

### UT-198 add product không ACTIVE

- Bước. product.findFirst trả null.
- Expected. Ném NotFoundException message Product not available. cartItem.upsert không được gọi.

### UT-199 add product DRAFT

- Bước. findFirst where gồm status ACTIVE nên DRAFT không được trả.
- Expected. Ném NotFoundException message Product not available.

### UT-200 add vượt tồn khi chưa có dòng

- Bước. stock 2, chưa có cartItem, dto.quantity 3.
- Expected. Ném BadRequestException message Quantity exceeds available stock.

### UT-201 add cộng dồn vượt tồn

- Bước. stock 5, dòng hiện tại quantity 4, dto.quantity 2.
- Expected. Ném BadRequestException message Quantity exceeds available stock. quantity tính là 6.

### UT-202 add dòng mới đúng tồn

- Bước. stock 5, chưa có dòng, dto.quantity 2.
- Expected. cartItem.upsert create quantity 2. Sau đó get(userId).

### UT-203 add cộng dồn đúng tồn

- Bước. stock 5, dòng hiện tại 2, dto.quantity 3.
- Expected. upsert update quantity 5.

### UT-204 add đúng bằng tồn

- Bước. stock 5, chưa có dòng, dto.quantity 5.
- Expected. Không ném. quantity ghi là 5.

### UT-205 update item không thuộc user

- Bước. cartItem.findFirst trả null.
- Expected. Ném NotFoundException message Cart item not found.

### UT-206 update vượt tồn

- Bước. item.product.stock 2, dto.quantity 3.
- Expected. Ném BadRequestException message Quantity exceeds available stock.

### UT-207 update đúng tồn

- Bước. stock 4, dto.quantity 4.
- Expected. cartItem.update data.quantity 4. Trả get(userId).

### UT-208 remove item không thuộc user

- Bước. findFirst trả null.
- Expected. Ném NotFoundException message Cart item not found. delete không được gọi.

### UT-209 remove item thuộc user

- Bước. findFirst trả item.
- Expected. cartItem.delete where id. Trả get(userId).

### UT-210 clear khi chưa có cart

- Bước. cart.findUnique trả null.
- Expected. deleteMany không được gọi. Vẫn gọi get(userId), upsert sẽ tạo cart rỗng.

### UT-211 clear khi có cart

- Bước. cart id c1.
- Expected. cartItem.deleteMany where.cartId c1. Trả get(userId).

## OrdersService checkout

### UT-212 Không coupon, dưới ngưỡng ship

- Bước. Address thuộc user. Cart một store. Mọi dòng không vượt stock. subtotal tính từ giá nhân số lượng bằng 499999. Không gửi couponCode.
- Expected. shippingAmount bằng 30000. discountAmount bằng 0. totalAmount bằng 529999. statusHistory đầu là PENDING_PAYMENT note Order created. cartItem.deleteMany được gọi.

### UT-213 Không coupon, đúng ngưỡng ship

- Bước. Address thuộc user. Cart một store. Mọi dòng không vượt stock. subtotal tính từ giá nhân số lượng bằng 500000. Không gửi couponCode.
- Expected. shippingAmount bằng 0. discountAmount bằng 0. totalAmount bằng 500000. statusHistory đầu là PENDING_PAYMENT note Order created. cartItem.deleteMany được gọi.

### UT-214 Không coupon, trên ngưỡng ship

- Bước. Address thuộc user. Cart một store. Mọi dòng không vượt stock. subtotal tính từ giá nhân số lượng bằng 500001. Không gửi couponCode.
- Expected. shippingAmount bằng 0. discountAmount bằng 0. totalAmount bằng 500001. statusHistory đầu là PENDING_PAYMENT note Order created. cartItem.deleteMany được gọi.

### UT-215 Percent 10 dưới ngưỡng ship

- Bước. Address thuộc user. Cart một store. Mọi dòng không vượt stock. subtotal tính từ giá nhân số lượng bằng 100000. Coupon percentOff 10, không fixedAmountOff.
- Expected. shippingAmount bằng 30000. discountAmount bằng 10000. totalAmount bằng 120000. statusHistory đầu là PENDING_PAYMENT note Order created. cartItem.deleteMany được gọi.

### UT-216 Percent 10 trên ngưỡng ship

- Bước. Address thuộc user. Cart một store. Mọi dòng không vượt stock. subtotal tính từ giá nhân số lượng bằng 500000. Coupon percentOff 10.
- Expected. shippingAmount bằng 0. discountAmount bằng 50000. totalAmount bằng 450000. statusHistory đầu là PENDING_PAYMENT note Order created. cartItem.deleteMany được gọi.

### UT-217 Fixed nhỏ hơn subtotal

- Bước. Address thuộc user. Cart một store. Mọi dòng không vượt stock. subtotal tính từ giá nhân số lượng bằng 100000. Coupon fixedAmountOff 20000.
- Expected. shippingAmount bằng 30000. discountAmount bằng 20000. totalAmount bằng 110000. statusHistory đầu là PENDING_PAYMENT note Order created. cartItem.deleteMany được gọi.

### UT-218 Fixed lớn hơn subtotal bị cắt

- Bước. Address thuộc user. Cart một store. Mọi dòng không vượt stock. subtotal tính từ giá nhân số lượng bằng 100000. Coupon fixedAmountOff 999999.
- Expected. shippingAmount bằng 30000. discountAmount bằng 100000. totalAmount bằng 30000. statusHistory đầu là PENDING_PAYMENT note Order created. cartItem.deleteMany được gọi.

### UT-219 Percent 100

- Bước. Address thuộc user. Cart một store. Mọi dòng không vượt stock. subtotal tính từ giá nhân số lượng bằng 80000. Coupon percentOff 100.
- Expected. shippingAmount bằng 30000. discountAmount bằng 80000. totalAmount bằng 30000. statusHistory đầu là PENDING_PAYMENT note Order created. cartItem.deleteMany được gọi.

### UT-220 Address không thuộc user

- Bước. address.findFirst trả null.
- Expected. Ném NotFoundException message Shipping address not found.

### UT-221 Cart không tồn tại

- Bước. cart.findUnique trả null.
- Expected. Ném BadRequestException message Cart is empty.

### UT-222 Cart không có item

- Bước. cart.items là [].
- Expected. Ném BadRequestException message Cart is empty.

### UT-223 Hai store trong một cart

- Bước. Hai item có storeId khác nhau.
- Expected. Ném BadRequestException message Checkout supports one store at a time.

### UT-224 Một dòng vượt tồn trước transaction

- Bước. item.quantity lớn hơn product.stock. product.name là Áo.
- Expected. Ném BadRequestException message Insufficient stock for Áo.

### UT-225 Tồn bị trừ mất trong transaction

- Bước. updateMany count trả 0. product.name là Áo.
- Expected. Ném BadRequestException message Insufficient stock for Áo. order.create không được gọi.

### UT-226 Ghi SALE

- Bước. Checkout hợp lệ, stock trước là 5, quantity 2.
- Expected. inventoryTransaction type SALE, quantity -2, before 5, after 3, reason Order checkout.

### UT-227 Mã đơn

- Bước. Checkout hợp lệ.
- Expected. order.code bắt đầu bằng CV- và có dấu gạch nối. buyerId và storeId đúng.

### UT-228 Coupon không hợp lệ vì coupon null

- Bước. dto.couponCode là sale. validCoupon thấy coupon null.
- Expected. Ném BadRequestException message Coupon is not valid. order.create không được gọi.

### UT-229 Coupon không hợp lệ vì storeId khác

- Bước. dto.couponCode là sale. validCoupon thấy storeId khác.
- Expected. Ném BadRequestException message Coupon is not valid. order.create không được gọi.

### UT-230 Coupon không hợp lệ vì active false

- Bước. dto.couponCode là sale. validCoupon thấy active false.
- Expected. Ném BadRequestException message Coupon is not valid. order.create không được gọi.

### UT-231 Coupon không hợp lệ vì expiresAt đã qua

- Bước. dto.couponCode là sale. validCoupon thấy expiresAt đã qua.
- Expected. Ném BadRequestException message Coupon is not valid. order.create không được gọi.

### UT-232 Coupon không hợp lệ vì usedCount bằng maxUses

- Bước. dto.couponCode là sale. validCoupon thấy usedCount bằng maxUses.
- Expected. Ném BadRequestException message Coupon is not valid. order.create không được gọi.

### UT-233 Coupon không hợp lệ vì subtotal nhỏ hơn minOrderAmount

- Bước. dto.couponCode là sale. validCoupon thấy subtotal nhỏ hơn minOrderAmount.
- Expected. Ném BadRequestException message Coupon is not valid. order.create không được gọi.

### UT-234 Coupon hợp lệ tăng usedCount

- Bước. Coupon active, đúng store, còn lượt, subtotal đủ.
- Expected. coupon.update usedCount increment 1. order.couponCode bằng code đã upper-case.

### UT-235 Coupon code được trim và upper

- Bước. dto.couponCode là '  sale '. findUnique where.code.
- Expected. where.code bằng SALE.

## OrdersService cancel

### UT-236 Buyer hủy từ PENDING_PAYMENT

- Bước. buyerOrder thuộc user, status PENDING_PAYMENT.
- Expected. Đổi status thành CANCELLED, note Cancelled by buyer, và hoàn tồn từng item.

### UT-237 Buyer hủy từ PAID

- Bước. buyerOrder thuộc user, status PAID.
- Expected. Đổi status thành CANCELLED, note Cancelled by buyer, và hoàn tồn từng item.

### UT-238 Buyer hủy từ CONFIRMED

- Bước. buyerOrder thuộc user, status CONFIRMED.
- Expected. Đổi status thành CANCELLED, note Cancelled by buyer, và hoàn tồn từng item.

### UT-239 Buyer hủy từ PACKING

- Bước. buyerOrder thuộc user, status PACKING.
- Expected. Ném BadRequestException message Order can no longer be cancelled.

### UT-240 Buyer hủy từ SHIPPING

- Bước. buyerOrder thuộc user, status SHIPPING.
- Expected. Ném BadRequestException message Order can no longer be cancelled.

### UT-241 Buyer hủy từ DELIVERED

- Bước. buyerOrder thuộc user, status DELIVERED.
- Expected. Ném BadRequestException message Order can no longer be cancelled.

### UT-242 Buyer hủy từ COMPLETED

- Bước. buyerOrder thuộc user, status COMPLETED.
- Expected. Ném BadRequestException message Order can no longer be cancelled.

### UT-243 Buyer hủy từ CANCELLED

- Bước. buyerOrder thuộc user, status CANCELLED.
- Expected. Ném BadRequestException message Order can no longer be cancelled.

### UT-244 Buyer hủy từ REFUND_REQUESTED

- Bước. buyerOrder thuộc user, status REFUND_REQUESTED.
- Expected. Ném BadRequestException message Order can no longer be cancelled.

### UT-245 Buyer hủy từ REFUNDED

- Bước. buyerOrder thuộc user, status REFUNDED.
- Expected. Ném BadRequestException message Order can no longer be cancelled.

### UT-246 Buyer hủy đơn của người khác

- Bước. order.findFirst trả null.
- Expected. Ném NotFoundException message Order not found.

## OrdersService buyerOrder

### UT-247 Không thấy đơn

- Bước. findFirst where id và buyerId trả null.
- Expected. Ném NotFoundException message Order not found.

## OrdersService buyerOrders

### UT-248 Chỉ đơn của buyer

- Bước. Gọi buyerOrders('u1').
- Expected. findMany where.buyerId u1, orderBy createdAt desc.

## OrdersService sellerOrders

### UT-249 Chỉ đơn của store seller

- Bước. Gọi sellerOrders('s1').
- Expected. findMany where.store.sellerId s1, orderBy createdAt desc.

## OrdersService sellerUpdate

### UT-250 PENDING_PAYMENT sang PENDING_PAYMENT

- Bước. Đơn thuộc store của seller, status PENDING_PAYMENT. dto.status là PENDING_PAYMENT.
- Expected. Ném BadRequestException message Invalid transition PENDING_PAYMENT → PENDING_PAYMENT.

### UT-251 PENDING_PAYMENT sang PAID

- Bước. Đơn thuộc store của seller, status PENDING_PAYMENT. dto.status là PAID.
- Expected. Ném BadRequestException message Invalid transition PENDING_PAYMENT → PAID.

### UT-252 PENDING_PAYMENT sang CONFIRMED

- Bước. Đơn thuộc store của seller, status PENDING_PAYMENT. dto.status là CONFIRMED.
- Expected. Hợp lệ. order.update status CONFIRMED và thêm statusHistory.

### UT-253 PENDING_PAYMENT sang PACKING

- Bước. Đơn thuộc store của seller, status PENDING_PAYMENT. dto.status là PACKING.
- Expected. Ném BadRequestException message Invalid transition PENDING_PAYMENT → PACKING.

### UT-254 PENDING_PAYMENT sang SHIPPING

- Bước. Đơn thuộc store của seller, status PENDING_PAYMENT. dto.status là SHIPPING.
- Expected. Ném BadRequestException message Invalid transition PENDING_PAYMENT → SHIPPING.

### UT-255 PENDING_PAYMENT sang DELIVERED

- Bước. Đơn thuộc store của seller, status PENDING_PAYMENT. dto.status là DELIVERED.
- Expected. Ném BadRequestException message Invalid transition PENDING_PAYMENT → DELIVERED.

### UT-256 PENDING_PAYMENT sang COMPLETED

- Bước. Đơn thuộc store của seller, status PENDING_PAYMENT. dto.status là COMPLETED.
- Expected. Ném BadRequestException message Invalid transition PENDING_PAYMENT → COMPLETED.

### UT-257 PENDING_PAYMENT sang CANCELLED

- Bước. Đơn thuộc store của seller, status PENDING_PAYMENT. dto.status là CANCELLED.
- Expected. Hợp lệ. Đổi CANCELLED và hoàn tồn.

### UT-258 PENDING_PAYMENT sang REFUND_REQUESTED

- Bước. Đơn thuộc store của seller, status PENDING_PAYMENT. dto.status là REFUND_REQUESTED.
- Expected. Ném BadRequestException message Invalid transition PENDING_PAYMENT → REFUND_REQUESTED.

### UT-259 PENDING_PAYMENT sang REFUNDED

- Bước. Đơn thuộc store của seller, status PENDING_PAYMENT. dto.status là REFUNDED.
- Expected. Ném BadRequestException message Invalid transition PENDING_PAYMENT → REFUNDED.

### UT-260 PAID sang PENDING_PAYMENT

- Bước. Đơn thuộc store của seller, status PAID. dto.status là PENDING_PAYMENT.
- Expected. Ném BadRequestException message Invalid transition PAID → PENDING_PAYMENT.

### UT-261 PAID sang PAID

- Bước. Đơn thuộc store của seller, status PAID. dto.status là PAID.
- Expected. Ném BadRequestException message Invalid transition PAID → PAID.

### UT-262 PAID sang CONFIRMED

- Bước. Đơn thuộc store của seller, status PAID. dto.status là CONFIRMED.
- Expected. Hợp lệ. order.update status CONFIRMED và thêm statusHistory.

### UT-263 PAID sang PACKING

- Bước. Đơn thuộc store của seller, status PAID. dto.status là PACKING.
- Expected. Ném BadRequestException message Invalid transition PAID → PACKING.

### UT-264 PAID sang SHIPPING

- Bước. Đơn thuộc store của seller, status PAID. dto.status là SHIPPING.
- Expected. Ném BadRequestException message Invalid transition PAID → SHIPPING.

### UT-265 PAID sang DELIVERED

- Bước. Đơn thuộc store của seller, status PAID. dto.status là DELIVERED.
- Expected. Ném BadRequestException message Invalid transition PAID → DELIVERED.

### UT-266 PAID sang COMPLETED

- Bước. Đơn thuộc store của seller, status PAID. dto.status là COMPLETED.
- Expected. Ném BadRequestException message Invalid transition PAID → COMPLETED.

### UT-267 PAID sang CANCELLED

- Bước. Đơn thuộc store của seller, status PAID. dto.status là CANCELLED.
- Expected. Hợp lệ. Đổi CANCELLED và hoàn tồn.

### UT-268 PAID sang REFUND_REQUESTED

- Bước. Đơn thuộc store của seller, status PAID. dto.status là REFUND_REQUESTED.
- Expected. Ném BadRequestException message Invalid transition PAID → REFUND_REQUESTED.

### UT-269 PAID sang REFUNDED

- Bước. Đơn thuộc store của seller, status PAID. dto.status là REFUNDED.
- Expected. Ném BadRequestException message Invalid transition PAID → REFUNDED.

### UT-270 CONFIRMED sang PENDING_PAYMENT

- Bước. Đơn thuộc store của seller, status CONFIRMED. dto.status là PENDING_PAYMENT.
- Expected. Ném BadRequestException message Invalid transition CONFIRMED → PENDING_PAYMENT.

### UT-271 CONFIRMED sang PAID

- Bước. Đơn thuộc store của seller, status CONFIRMED. dto.status là PAID.
- Expected. Ném BadRequestException message Invalid transition CONFIRMED → PAID.

### UT-272 CONFIRMED sang CONFIRMED

- Bước. Đơn thuộc store của seller, status CONFIRMED. dto.status là CONFIRMED.
- Expected. Ném BadRequestException message Invalid transition CONFIRMED → CONFIRMED.

### UT-273 CONFIRMED sang PACKING

- Bước. Đơn thuộc store của seller, status CONFIRMED. dto.status là PACKING.
- Expected. Hợp lệ. order.update status PACKING và thêm statusHistory.

### UT-274 CONFIRMED sang SHIPPING

- Bước. Đơn thuộc store của seller, status CONFIRMED. dto.status là SHIPPING.
- Expected. Ném BadRequestException message Invalid transition CONFIRMED → SHIPPING.

### UT-275 CONFIRMED sang DELIVERED

- Bước. Đơn thuộc store của seller, status CONFIRMED. dto.status là DELIVERED.
- Expected. Ném BadRequestException message Invalid transition CONFIRMED → DELIVERED.

### UT-276 CONFIRMED sang COMPLETED

- Bước. Đơn thuộc store của seller, status CONFIRMED. dto.status là COMPLETED.
- Expected. Ném BadRequestException message Invalid transition CONFIRMED → COMPLETED.

### UT-277 CONFIRMED sang CANCELLED

- Bước. Đơn thuộc store của seller, status CONFIRMED. dto.status là CANCELLED.
- Expected. Hợp lệ. Đổi CANCELLED và hoàn tồn.

### UT-278 CONFIRMED sang REFUND_REQUESTED

- Bước. Đơn thuộc store của seller, status CONFIRMED. dto.status là REFUND_REQUESTED.
- Expected. Ném BadRequestException message Invalid transition CONFIRMED → REFUND_REQUESTED.

### UT-279 CONFIRMED sang REFUNDED

- Bước. Đơn thuộc store của seller, status CONFIRMED. dto.status là REFUNDED.
- Expected. Ném BadRequestException message Invalid transition CONFIRMED → REFUNDED.

### UT-280 PACKING sang PENDING_PAYMENT

- Bước. Đơn thuộc store của seller, status PACKING. dto.status là PENDING_PAYMENT.
- Expected. Ném BadRequestException message Invalid transition PACKING → PENDING_PAYMENT.

### UT-281 PACKING sang PAID

- Bước. Đơn thuộc store của seller, status PACKING. dto.status là PAID.
- Expected. Ném BadRequestException message Invalid transition PACKING → PAID.

### UT-282 PACKING sang CONFIRMED

- Bước. Đơn thuộc store của seller, status PACKING. dto.status là CONFIRMED.
- Expected. Ném BadRequestException message Invalid transition PACKING → CONFIRMED.

### UT-283 PACKING sang PACKING

- Bước. Đơn thuộc store của seller, status PACKING. dto.status là PACKING.
- Expected. Ném BadRequestException message Invalid transition PACKING → PACKING.

### UT-284 PACKING sang SHIPPING

- Bước. Đơn thuộc store của seller, status PACKING. dto.status là SHIPPING.
- Expected. Hợp lệ. order.update status SHIPPING và thêm statusHistory.

### UT-285 PACKING sang DELIVERED

- Bước. Đơn thuộc store của seller, status PACKING. dto.status là DELIVERED.
- Expected. Ném BadRequestException message Invalid transition PACKING → DELIVERED.

### UT-286 PACKING sang COMPLETED

- Bước. Đơn thuộc store của seller, status PACKING. dto.status là COMPLETED.
- Expected. Ném BadRequestException message Invalid transition PACKING → COMPLETED.

### UT-287 PACKING sang CANCELLED

- Bước. Đơn thuộc store của seller, status PACKING. dto.status là CANCELLED.
- Expected. Ném BadRequestException message Invalid transition PACKING → CANCELLED.

### UT-288 PACKING sang REFUND_REQUESTED

- Bước. Đơn thuộc store của seller, status PACKING. dto.status là REFUND_REQUESTED.
- Expected. Ném BadRequestException message Invalid transition PACKING → REFUND_REQUESTED.

### UT-289 PACKING sang REFUNDED

- Bước. Đơn thuộc store của seller, status PACKING. dto.status là REFUNDED.
- Expected. Ném BadRequestException message Invalid transition PACKING → REFUNDED.

### UT-290 SHIPPING sang PENDING_PAYMENT

- Bước. Đơn thuộc store của seller, status SHIPPING. dto.status là PENDING_PAYMENT.
- Expected. Ném BadRequestException message Invalid transition SHIPPING → PENDING_PAYMENT.

### UT-291 SHIPPING sang PAID

- Bước. Đơn thuộc store của seller, status SHIPPING. dto.status là PAID.
- Expected. Ném BadRequestException message Invalid transition SHIPPING → PAID.

### UT-292 SHIPPING sang CONFIRMED

- Bước. Đơn thuộc store của seller, status SHIPPING. dto.status là CONFIRMED.
- Expected. Ném BadRequestException message Invalid transition SHIPPING → CONFIRMED.

### UT-293 SHIPPING sang PACKING

- Bước. Đơn thuộc store của seller, status SHIPPING. dto.status là PACKING.
- Expected. Ném BadRequestException message Invalid transition SHIPPING → PACKING.

### UT-294 SHIPPING sang SHIPPING

- Bước. Đơn thuộc store của seller, status SHIPPING. dto.status là SHIPPING.
- Expected. Ném BadRequestException message Invalid transition SHIPPING → SHIPPING.

### UT-295 SHIPPING sang DELIVERED

- Bước. Đơn thuộc store của seller, status SHIPPING. dto.status là DELIVERED.
- Expected. Hợp lệ. order.update status DELIVERED và thêm statusHistory.

### UT-296 SHIPPING sang COMPLETED

- Bước. Đơn thuộc store của seller, status SHIPPING. dto.status là COMPLETED.
- Expected. Ném BadRequestException message Invalid transition SHIPPING → COMPLETED.

### UT-297 SHIPPING sang CANCELLED

- Bước. Đơn thuộc store của seller, status SHIPPING. dto.status là CANCELLED.
- Expected. Ném BadRequestException message Invalid transition SHIPPING → CANCELLED.

### UT-298 SHIPPING sang REFUND_REQUESTED

- Bước. Đơn thuộc store của seller, status SHIPPING. dto.status là REFUND_REQUESTED.
- Expected. Ném BadRequestException message Invalid transition SHIPPING → REFUND_REQUESTED.

### UT-299 SHIPPING sang REFUNDED

- Bước. Đơn thuộc store của seller, status SHIPPING. dto.status là REFUNDED.
- Expected. Ném BadRequestException message Invalid transition SHIPPING → REFUNDED.

### UT-300 DELIVERED sang PENDING_PAYMENT

- Bước. Đơn thuộc store của seller, status DELIVERED. dto.status là PENDING_PAYMENT.
- Expected. Ném BadRequestException message Invalid transition DELIVERED → PENDING_PAYMENT.

### UT-301 DELIVERED sang PAID

- Bước. Đơn thuộc store của seller, status DELIVERED. dto.status là PAID.
- Expected. Ném BadRequestException message Invalid transition DELIVERED → PAID.

### UT-302 DELIVERED sang CONFIRMED

- Bước. Đơn thuộc store của seller, status DELIVERED. dto.status là CONFIRMED.
- Expected. Ném BadRequestException message Invalid transition DELIVERED → CONFIRMED.

### UT-303 DELIVERED sang PACKING

- Bước. Đơn thuộc store của seller, status DELIVERED. dto.status là PACKING.
- Expected. Ném BadRequestException message Invalid transition DELIVERED → PACKING.

### UT-304 DELIVERED sang SHIPPING

- Bước. Đơn thuộc store của seller, status DELIVERED. dto.status là SHIPPING.
- Expected. Ném BadRequestException message Invalid transition DELIVERED → SHIPPING.

### UT-305 DELIVERED sang DELIVERED

- Bước. Đơn thuộc store của seller, status DELIVERED. dto.status là DELIVERED.
- Expected. Ném BadRequestException message Invalid transition DELIVERED → DELIVERED.

### UT-306 DELIVERED sang COMPLETED

- Bước. Đơn thuộc store của seller, status DELIVERED. dto.status là COMPLETED.
- Expected. Hợp lệ. order.update status COMPLETED và thêm statusHistory.

### UT-307 DELIVERED sang CANCELLED

- Bước. Đơn thuộc store của seller, status DELIVERED. dto.status là CANCELLED.
- Expected. Ném BadRequestException message Invalid transition DELIVERED → CANCELLED.

### UT-308 DELIVERED sang REFUND_REQUESTED

- Bước. Đơn thuộc store của seller, status DELIVERED. dto.status là REFUND_REQUESTED.
- Expected. Ném BadRequestException message Invalid transition DELIVERED → REFUND_REQUESTED.

### UT-309 DELIVERED sang REFUNDED

- Bước. Đơn thuộc store của seller, status DELIVERED. dto.status là REFUNDED.
- Expected. Ném BadRequestException message Invalid transition DELIVERED → REFUNDED.

### UT-310 COMPLETED sang PENDING_PAYMENT

- Bước. Đơn thuộc store của seller, status COMPLETED. dto.status là PENDING_PAYMENT.
- Expected. Ném BadRequestException message Invalid transition COMPLETED → PENDING_PAYMENT.

### UT-311 COMPLETED sang PAID

- Bước. Đơn thuộc store của seller, status COMPLETED. dto.status là PAID.
- Expected. Ném BadRequestException message Invalid transition COMPLETED → PAID.

### UT-312 COMPLETED sang CONFIRMED

- Bước. Đơn thuộc store của seller, status COMPLETED. dto.status là CONFIRMED.
- Expected. Ném BadRequestException message Invalid transition COMPLETED → CONFIRMED.

### UT-313 COMPLETED sang PACKING

- Bước. Đơn thuộc store của seller, status COMPLETED. dto.status là PACKING.
- Expected. Ném BadRequestException message Invalid transition COMPLETED → PACKING.

### UT-314 COMPLETED sang SHIPPING

- Bước. Đơn thuộc store của seller, status COMPLETED. dto.status là SHIPPING.
- Expected. Ném BadRequestException message Invalid transition COMPLETED → SHIPPING.

### UT-315 COMPLETED sang DELIVERED

- Bước. Đơn thuộc store của seller, status COMPLETED. dto.status là DELIVERED.
- Expected. Ném BadRequestException message Invalid transition COMPLETED → DELIVERED.

### UT-316 COMPLETED sang COMPLETED

- Bước. Đơn thuộc store của seller, status COMPLETED. dto.status là COMPLETED.
- Expected. Ném BadRequestException message Invalid transition COMPLETED → COMPLETED.

### UT-317 COMPLETED sang CANCELLED

- Bước. Đơn thuộc store của seller, status COMPLETED. dto.status là CANCELLED.
- Expected. Ném BadRequestException message Invalid transition COMPLETED → CANCELLED.

### UT-318 COMPLETED sang REFUND_REQUESTED

- Bước. Đơn thuộc store của seller, status COMPLETED. dto.status là REFUND_REQUESTED.
- Expected. Ném BadRequestException message Invalid transition COMPLETED → REFUND_REQUESTED.

### UT-319 COMPLETED sang REFUNDED

- Bước. Đơn thuộc store của seller, status COMPLETED. dto.status là REFUNDED.
- Expected. Ném BadRequestException message Invalid transition COMPLETED → REFUNDED.

### UT-320 CANCELLED sang PENDING_PAYMENT

- Bước. Đơn thuộc store của seller, status CANCELLED. dto.status là PENDING_PAYMENT.
- Expected. Ném BadRequestException message Invalid transition CANCELLED → PENDING_PAYMENT.

### UT-321 CANCELLED sang PAID

- Bước. Đơn thuộc store của seller, status CANCELLED. dto.status là PAID.
- Expected. Ném BadRequestException message Invalid transition CANCELLED → PAID.

### UT-322 CANCELLED sang CONFIRMED

- Bước. Đơn thuộc store của seller, status CANCELLED. dto.status là CONFIRMED.
- Expected. Ném BadRequestException message Invalid transition CANCELLED → CONFIRMED.

### UT-323 CANCELLED sang PACKING

- Bước. Đơn thuộc store của seller, status CANCELLED. dto.status là PACKING.
- Expected. Ném BadRequestException message Invalid transition CANCELLED → PACKING.

### UT-324 CANCELLED sang SHIPPING

- Bước. Đơn thuộc store của seller, status CANCELLED. dto.status là SHIPPING.
- Expected. Ném BadRequestException message Invalid transition CANCELLED → SHIPPING.

### UT-325 CANCELLED sang DELIVERED

- Bước. Đơn thuộc store của seller, status CANCELLED. dto.status là DELIVERED.
- Expected. Ném BadRequestException message Invalid transition CANCELLED → DELIVERED.

### UT-326 CANCELLED sang COMPLETED

- Bước. Đơn thuộc store của seller, status CANCELLED. dto.status là COMPLETED.
- Expected. Ném BadRequestException message Invalid transition CANCELLED → COMPLETED.

### UT-327 CANCELLED sang CANCELLED

- Bước. Đơn thuộc store của seller, status CANCELLED. dto.status là CANCELLED.
- Expected. Ném BadRequestException message Invalid transition CANCELLED → CANCELLED.

### UT-328 CANCELLED sang REFUND_REQUESTED

- Bước. Đơn thuộc store của seller, status CANCELLED. dto.status là REFUND_REQUESTED.
- Expected. Ném BadRequestException message Invalid transition CANCELLED → REFUND_REQUESTED.

### UT-329 CANCELLED sang REFUNDED

- Bước. Đơn thuộc store của seller, status CANCELLED. dto.status là REFUNDED.
- Expected. Ném BadRequestException message Invalid transition CANCELLED → REFUNDED.

### UT-330 REFUND_REQUESTED sang PENDING_PAYMENT

- Bước. Đơn thuộc store của seller, status REFUND_REQUESTED. dto.status là PENDING_PAYMENT.
- Expected. Ném BadRequestException message Invalid transition REFUND_REQUESTED → PENDING_PAYMENT.

### UT-331 REFUND_REQUESTED sang PAID

- Bước. Đơn thuộc store của seller, status REFUND_REQUESTED. dto.status là PAID.
- Expected. Ném BadRequestException message Invalid transition REFUND_REQUESTED → PAID.

### UT-332 REFUND_REQUESTED sang CONFIRMED

- Bước. Đơn thuộc store của seller, status REFUND_REQUESTED. dto.status là CONFIRMED.
- Expected. Ném BadRequestException message Invalid transition REFUND_REQUESTED → CONFIRMED.

### UT-333 REFUND_REQUESTED sang PACKING

- Bước. Đơn thuộc store của seller, status REFUND_REQUESTED. dto.status là PACKING.
- Expected. Ném BadRequestException message Invalid transition REFUND_REQUESTED → PACKING.

### UT-334 REFUND_REQUESTED sang SHIPPING

- Bước. Đơn thuộc store của seller, status REFUND_REQUESTED. dto.status là SHIPPING.
- Expected. Ném BadRequestException message Invalid transition REFUND_REQUESTED → SHIPPING.

### UT-335 REFUND_REQUESTED sang DELIVERED

- Bước. Đơn thuộc store của seller, status REFUND_REQUESTED. dto.status là DELIVERED.
- Expected. Ném BadRequestException message Invalid transition REFUND_REQUESTED → DELIVERED.

### UT-336 REFUND_REQUESTED sang COMPLETED

- Bước. Đơn thuộc store của seller, status REFUND_REQUESTED. dto.status là COMPLETED.
- Expected. Ném BadRequestException message Invalid transition REFUND_REQUESTED → COMPLETED.

### UT-337 REFUND_REQUESTED sang CANCELLED

- Bước. Đơn thuộc store của seller, status REFUND_REQUESTED. dto.status là CANCELLED.
- Expected. Ném BadRequestException message Invalid transition REFUND_REQUESTED → CANCELLED.

### UT-338 REFUND_REQUESTED sang REFUND_REQUESTED

- Bước. Đơn thuộc store của seller, status REFUND_REQUESTED. dto.status là REFUND_REQUESTED.
- Expected. Ném BadRequestException message Invalid transition REFUND_REQUESTED → REFUND_REQUESTED.

### UT-339 REFUND_REQUESTED sang REFUNDED

- Bước. Đơn thuộc store của seller, status REFUND_REQUESTED. dto.status là REFUNDED.
- Expected. Hợp lệ. order.update status REFUNDED và thêm statusHistory.

### UT-340 REFUNDED sang PENDING_PAYMENT

- Bước. Đơn thuộc store của seller, status REFUNDED. dto.status là PENDING_PAYMENT.
- Expected. Ném BadRequestException message Invalid transition REFUNDED → PENDING_PAYMENT.

### UT-341 REFUNDED sang PAID

- Bước. Đơn thuộc store của seller, status REFUNDED. dto.status là PAID.
- Expected. Ném BadRequestException message Invalid transition REFUNDED → PAID.

### UT-342 REFUNDED sang CONFIRMED

- Bước. Đơn thuộc store của seller, status REFUNDED. dto.status là CONFIRMED.
- Expected. Ném BadRequestException message Invalid transition REFUNDED → CONFIRMED.

### UT-343 REFUNDED sang PACKING

- Bước. Đơn thuộc store của seller, status REFUNDED. dto.status là PACKING.
- Expected. Ném BadRequestException message Invalid transition REFUNDED → PACKING.

### UT-344 REFUNDED sang SHIPPING

- Bước. Đơn thuộc store của seller, status REFUNDED. dto.status là SHIPPING.
- Expected. Ném BadRequestException message Invalid transition REFUNDED → SHIPPING.

### UT-345 REFUNDED sang DELIVERED

- Bước. Đơn thuộc store của seller, status REFUNDED. dto.status là DELIVERED.
- Expected. Ném BadRequestException message Invalid transition REFUNDED → DELIVERED.

### UT-346 REFUNDED sang COMPLETED

- Bước. Đơn thuộc store của seller, status REFUNDED. dto.status là COMPLETED.
- Expected. Ném BadRequestException message Invalid transition REFUNDED → COMPLETED.

### UT-347 REFUNDED sang CANCELLED

- Bước. Đơn thuộc store của seller, status REFUNDED. dto.status là CANCELLED.
- Expected. Ném BadRequestException message Invalid transition REFUNDED → CANCELLED.

### UT-348 REFUNDED sang REFUND_REQUESTED

- Bước. Đơn thuộc store của seller, status REFUNDED. dto.status là REFUND_REQUESTED.
- Expected. Ném BadRequestException message Invalid transition REFUNDED → REFUND_REQUESTED.

### UT-349 REFUNDED sang REFUNDED

- Bước. Đơn thuộc store của seller, status REFUNDED. dto.status là REFUNDED.
- Expected. Ném BadRequestException message Invalid transition REFUNDED → REFUNDED.

### UT-350 Đơn không thuộc seller

- Bước. findFirst trả null.
- Expected. Ném NotFoundException message Order not found.

## OrdersService createCoupon

### UT-351 Seller chưa có store

- Bước. store.findUnique trả null.
- Expected. Ném ForbiddenException message Store required.

### UT-352 Không chọn loại giảm

- Bước. percentOff và fixedAmountOff đều trống.
- Expected. Ném BadRequestException message Choose percent or fixed discount.

### UT-353 Chọn cả hai loại giảm

- Bước. Có cả percentOff và fixedAmountOff.
- Expected. Ném BadRequestException message Choose percent or fixed discount.

### UT-354 Chỉ percent

- Bước. percentOff 10, không fixed. code là '  sale '.
- Expected. coupon.create code bằng SALE, percentOff 10, fixedAmountOff không set.

### UT-355 Chỉ fixed

- Bước. fixedAmountOff 20000, không percent.
- Expected. coupon.create fixedAmountOff là Decimal 20000.

### UT-356 minOrderAmount mặc định

- Bước. Không gửi minOrderAmount.
- Expected. minOrderAmount là Decimal 0.

## PaymentsService

### UT-357 tạo payment cho đơn không thuộc buyer

- Bước. order.findFirst trả null.
- Expected. Ném NotFoundException message Order not found.

### UT-358 create khi đơn PAID

- Bước. order.status là PAID.
- Expected. Ném ConflictException message Order is not awaiting payment.

### UT-359 create khi đơn CONFIRMED

- Bước. order.status là CONFIRMED.
- Expected. Ném ConflictException message Order is not awaiting payment.

### UT-360 create khi đơn PACKING

- Bước. order.status là PACKING.
- Expected. Ném ConflictException message Order is not awaiting payment.

### UT-361 create khi đơn SHIPPING

- Bước. order.status là SHIPPING.
- Expected. Ném ConflictException message Order is not awaiting payment.

### UT-362 create khi đơn DELIVERED

- Bước. order.status là DELIVERED.
- Expected. Ném ConflictException message Order is not awaiting payment.

### UT-363 create khi đơn COMPLETED

- Bước. order.status là COMPLETED.
- Expected. Ném ConflictException message Order is not awaiting payment.

### UT-364 create khi đơn CANCELLED

- Bước. order.status là CANCELLED.
- Expected. Ném ConflictException message Order is not awaiting payment.

### UT-365 create khi đơn REFUND_REQUESTED

- Bước. order.status là REFUND_REQUESTED.
- Expected. Ném ConflictException message Order is not awaiting payment.

### UT-366 create khi đơn REFUNDED

- Bước. order.status là REFUNDED.
- Expected. Ném ConflictException message Order is not awaiting payment.

### UT-367 create khi đã SUCCESS

- Bước. status PENDING_PAYMENT nhưng payment.status SUCCESS.
- Expected. Ném ConflictException message Order already paid.

### UT-368 create gán requestId mới

- Bước. post trả resultCode 1001, message rejected.
- Expected. Ném BadRequestException message rejected.

### UT-369 create ghi đúng amount của đơn

- Bước. post trả resultCode 1001, không có message.
- Expected. Ném BadRequestException message MoMo rejected payment request.

### UT-370 create đưa payment về PENDING

- Bước. response.ok là false.
- Expected. Ném BadRequestException message MoMo gateway unavailable.

### UT-371 create trên payment đang chờ không tạo lại

- Bước. payment cũ PENDING, requestId là req-1. MoMo resultCode 0.
- Expected. upsert update payUrl. Trả paymentId, payUrl, requestId req-1. Không tạo requestId mới.

### UT-372 status chỉ của buyer

- Bước. Gọi status('u1', 'o1').
- Expected. payment.findFirst where.orderId o1 và order.buyerId u1.

### UT-373 confirm khi đơn không tồn tại

- Bước. findFirst trả null.
- Expected. Ném NotFoundException message Payment not found.

### UT-374 confirm khi đơn không chờ thanh toán

- Bước. verifyIpn trả false.
- Expected. Ném UnauthorizedException message Invalid MoMo signature. Không đọc payment.

### UT-375 confirm lần hai bị từ chối

- Bước. verifyIpn true. payment.findUnique trả null.
- Expected. Ném BadRequestException message Payment does not match order.

### UT-376 confirm ghi walletTransaction ORDER:

- Bước. payment.requestId khác payload.requestId.
- Expected. Ném BadRequestException message Payment does not match order.

### UT-377 confirm cộng đúng số tiền vào ví seller

- Bước. Number(payment.amount) khác Number(payload.amount).
- Expected. Ném BadRequestException message Payment does not match order.

### UT-378 confirm chuyển đơn sang PAID

- Bước. payment.status SUCCESS, chữ ký và amount khớp.
- Expected. Trả { resultCode: 0, message: 'Received' }. Không credit ví lần nữa.

### UT-379 confirm dùng store của đơn

- Bước. payload.resultCode là 1006. Payment đang PENDING.
- Expected. payment.update status FAILED, resultCode 1006. Trả Received. Không đổi order sang PAID.

### UT-380 confirm chỉ tạo một walletTransaction

- Bước. resultCode 0, amount khớp, payment chưa SUCCESS.
- Expected. payment SUCCESS, order PAID, note MoMo payment confirmed, walletTransaction ORDER_CREDIT reference ORDER:orderId, availableBalance tăng đúng amount.

### UT-381 refund không có payment

- Bước. findFirst trả null.
- Expected. Ném BadRequestException message Successful payment required.

### UT-382 refund payment PENDING

- Bước. status PENDING.
- Expected. Ném BadRequestException message Successful payment required.

### UT-383 refund không cần providerTransactionId

- Bước. status SUCCESS, providerTransactionId null.
- Expected. Ném BadRequestException message Successful payment required.

### UT-384 refund amount 0

- Bước. SUCCESS, amount 100000, refundedAmount 0, dto amount 0.
- Expected. Ném BadRequestException message Invalid refund amount.

### UT-385 refund amount âm

- Bước. dto amount -1.
- Expected. Ném BadRequestException message Invalid refund amount.

### UT-386 refund vượt phần còn lại

- Bước. amount 100000, refundedAmount 40000, dto amount 70000.
- Expected. Ném BadRequestException message Invalid refund amount.

### UT-387 refund đủ phần còn lại đánh dấu REFUNDED

- Bước. amount 100000, refundedAmount 40000, dto amount 60000. MoMo resultCode 0. Ví đủ.
- Expected. Không ném Invalid refund amount. refundedAmount mới bằng 100000.

### UT-388 refund ví seller không đủ

- Bước. MoMo resultCode 0. wallet.availableBalance nhỏ hơn refundAmount.
- Expected. Ném BadRequestException message Insufficient seller balance for refund.

### UT-389 refund ghi nhận debit ví

- Bước. post trả resultCode khác 0, message no.
- Expected. Ném BadRequestException message no.

## SellerFinanceService

### UT-390 summary chưa có store

- Bước. store.findUnique trả null.
- Expected. Ném NotFoundException message Store not found.

### UT-391 withdraw số dư không đủ

- Bước. wallet.availableBalance nhỏ hơn dto.amount.
- Expected. Ném BadRequestException message Insufficient wallet balance. withdrawalRequest.create không được gọi.

### UT-392 withdraw thua race

- Bước. Số dư đọc được đủ, nhưng updateMany count trả 0.
- Expected. Ném BadRequestException message Insufficient wallet balance.

### UT-393 withdraw thành công

- Bước. updateMany count 1.
- Expected. Tạo withdrawalRequest status PENDING và trừ availableBalance.

## OperationsService

### UT-394 Rút tiền PENDING->PENDING

- Bước. withdrawal status PENDING. dto.status PENDING.
- Expected. Ném BadRequestException message Invalid withdrawal transition.

### UT-395 Rút tiền PENDING->APPROVED

- Bước. withdrawal status PENDING. dto.status APPROVED.
- Expected. Hợp lệ. Update status. Không hoàn số dư. Ghi auditLog WITHDRAWAL_STATUS_UPDATED.

### UT-396 Rút tiền PENDING->REJECTED

- Bước. withdrawal status PENDING. dto.status REJECTED.
- Expected. Hợp lệ. Update status. Cộng lại availableBalance. Tạo walletTransaction ADJUSTMENT reference WITHDRAWAL_REJECTED:id. Ghi auditLog.

### UT-397 Rút tiền PENDING->PAID

- Bước. withdrawal status PENDING. dto.status PAID.
- Expected. Ném BadRequestException message Invalid withdrawal transition.

### UT-398 Rút tiền APPROVED->PENDING

- Bước. withdrawal status APPROVED. dto.status PENDING.
- Expected. Ném BadRequestException message Invalid withdrawal transition.

### UT-399 Rút tiền APPROVED->APPROVED

- Bước. withdrawal status APPROVED. dto.status APPROVED.
- Expected. Ném BadRequestException message Invalid withdrawal transition.

### UT-400 Rút tiền APPROVED->REJECTED

- Bước. withdrawal status APPROVED. dto.status REJECTED.
- Expected. Ném BadRequestException message Invalid withdrawal transition.

### UT-401 Rút tiền APPROVED->PAID

- Bước. withdrawal status APPROVED. dto.status PAID.
- Expected. Hợp lệ. Update status. Không hoàn số dư. Ghi auditLog WITHDRAWAL_STATUS_UPDATED.

### UT-402 Rút tiền REJECTED->PENDING

- Bước. withdrawal status REJECTED. dto.status PENDING.
- Expected. Ném BadRequestException message Invalid withdrawal transition.

### UT-403 Rút tiền REJECTED->APPROVED

- Bước. withdrawal status REJECTED. dto.status APPROVED.
- Expected. Ném BadRequestException message Invalid withdrawal transition.

### UT-404 Rút tiền REJECTED->REJECTED

- Bước. withdrawal status REJECTED. dto.status REJECTED.
- Expected. Ném BadRequestException message Invalid withdrawal transition.

### UT-405 Rút tiền REJECTED->PAID

- Bước. withdrawal status REJECTED. dto.status PAID.
- Expected. Ném BadRequestException message Invalid withdrawal transition.

### UT-406 Rút tiền PAID->PENDING

- Bước. withdrawal status PAID. dto.status PENDING.
- Expected. Ném BadRequestException message Invalid withdrawal transition.

### UT-407 Rút tiền PAID->APPROVED

- Bước. withdrawal status PAID. dto.status APPROVED.
- Expected. Ném BadRequestException message Invalid withdrawal transition.

### UT-408 Rút tiền PAID->REJECTED

- Bước. withdrawal status PAID. dto.status REJECTED.
- Expected. Ném BadRequestException message Invalid withdrawal transition.

### UT-409 Rút tiền PAID->PAID

- Bước. withdrawal status PAID. dto.status PAID.
- Expected. Ném BadRequestException message Invalid withdrawal transition.

### UT-410 Withdrawal không tồn tại

- Bước. findUnique trả null.
- Expected. Ném NotFoundException message Withdrawal not found.

## OperationsGuard

### UT-411 Thiếu header

- Bước. expected key có giá trị. header x-ops-api-key không có.
- Expected. Ném UnauthorizedException message Invalid operations key.

### UT-412 Sai key

- Bước. header khác OPS_API_KEY.
- Expected. Ném UnauthorizedException message Invalid operations key.

### UT-413 Đúng key

- Bước. header bằng OPS_API_KEY.
- Expected. Trả true.

### UT-414 Config không có key

- Bước. expected là chuỗi rỗng.
- Expected. Ném UnauthorizedException dù header cũng rỗng, vì !expected.

## OperationsService

### UT-415 overview đếm năm số

- Bước. Gọi overview().
- Expected. Trả users, stores, orders, successfulPayments, pendingWithdrawals. successfulPayments chỉ đếm payment SUCCESS. pendingWithdrawals chỉ đếm PENDING.

## UploadsService

### UT-416 presign image/jpeg

- Bước. contentType image/jpeg, fileName a.JPG, folder products, sellerId s1. publicUrl là https://cdn.example.
- Expected. Không ném. objectKey bắt đầu bằng products/s1/ và kết thúc bằng .jpg. expiresIn bằng 300. publicUrl bắt đầu bằng https://cdn.example/.

### UT-417 presign image/png

- Bước. contentType image/png, fileName a.JPG, folder products, sellerId s1. publicUrl là https://cdn.example.
- Expected. Không ném. objectKey bắt đầu bằng products/s1/ và kết thúc bằng .jpg. expiresIn bằng 300. publicUrl bắt đầu bằng https://cdn.example/.

### UT-418 presign image/webp

- Bước. contentType image/webp, fileName a.JPG, folder products, sellerId s1. publicUrl là https://cdn.example.
- Expected. Không ném. objectKey bắt đầu bằng products/s1/ và kết thúc bằng .jpg. expiresIn bằng 300. publicUrl bắt đầu bằng https://cdn.example/.

### UT-419 presign từ chối "image/gif"

- Bước. contentType "image/gif".
- Expected. Ném BadRequestException message Unsupported image type. getSignedUrl không được gọi.

### UT-420 presign từ chối "application/pdf"

- Bước. contentType "application/pdf".
- Expected. Ném BadRequestException message Unsupported image type. getSignedUrl không được gọi.

### UT-421 presign từ chối "text/plain"

- Bước. contentType "text/plain".
- Expected. Ném BadRequestException message Unsupported image type. getSignedUrl không được gọi.

### UT-422 presign từ chối ""

- Bước. contentType "".
- Expected. Ném BadRequestException message Unsupported image type. getSignedUrl không được gọi.

### UT-423 folder bị lọc ký tự lạ

- Bước. folder là '../Products_A!'. contentType image/png.
- Expected. objectKey bắt đầu bằng ProductsA/ rồi sellerId. Không chứa dấu chấm hay gạch chéo.

### UT-424 folder mặc định

- Bước. Không gửi folder. contentType image/png.
- Expected. objectKey bắt đầu bằng products/.

### UT-425 publicUrl rỗng

- Bước. CLOUDFLARE_R2_PUBLIC_URL là ''. contentType image/jpeg.
- Expected. publicUrl trong kết quả là undefined. uploadUrl vẫn được ký.

### UT-426 publicUrl bỏ slash cuối

- Bước. CLOUDFLARE_R2_PUBLIC_URL là https://cdn.example/.
- Expected. publicUrl ghép không có slash đôi.

### UT-427 extension lạ bị cắt

- Bước. fileName là a.JP$G. contentType image/jpeg.
- Expected. Phần extension sau replace chỉ còn ký tự . a-z 0-9. $ bị bỏ.

## DTO

### UT-428 RegisterDto email không phải email

- Bước. validate(RegisterDto) với email là buyer@.
- Expected. validate từ chối email.

### UT-429 RegisterDto email hợp lệ

- Bước. validate(RegisterDto) với email buyer@example.com, password 8 ký tự, name An.
- Expected. validate không có lỗi email, password, name.

### UT-430 RegisterDto password 7 ký tự

- Bước. validate(RegisterDto) với password là 1234567.
- Expected. validate từ chối password vì MinLength 8.

### UT-431 RegisterDto password 8 ký tự

- Bước. validate(RegisterDto) với password là 12345678, email và name hợp lệ.
- Expected. validate không từ chối password.

### UT-432 RegisterDto name 1 ký tự

- Bước. validate(RegisterDto) với name là A.
- Expected. validate từ chối name vì Length 2 đến 100.

### UT-433 RegisterDto name 2 ký tự

- Bước. validate(RegisterDto) với name là An, email và password hợp lệ.
- Expected. validate không từ chối name.

### UT-434 RegisterDto name 101 ký tự

- Bước. validate(RegisterDto) với name dài 101.
- Expected. validate từ chối name.

### UT-435 RegisterDto phone 5 ký tự

- Bước. validate(RegisterDto) với phone dài 5.
- Expected. validate từ chối phone vì Length 6 đến 20.

### UT-436 RegisterDto phone 6 ký tự

- Bước. validate(RegisterDto) với phone dài 6, các field khác hợp lệ.
- Expected. validate không từ chối phone.

### UT-437 RegisterDto phone 21 ký tự

- Bước. validate(RegisterDto) với phone dài 21.
- Expected. validate từ chối phone.

### UT-438 RegisterDto phone bỏ trống

- Bước. validate(RegisterDto) với không gửi phone.
- Expected. validate không từ chối. phone là optional.

### UT-439 AddCartItemDto quantity 0

- Bước. validate(AddCartItemDto) với quantity 0, productId có.
- Expected. validate từ chối quantity vì Min 1.

### UT-440 AddCartItemDto quantity 1

- Bước. validate(AddCartItemDto) với quantity 1, productId là p1.
- Expected. validate không có lỗi.

### UT-441 UpdateCartItemDto quantity 0

- Bước. validate(UpdateCartItemDto) với quantity 0.
- Expected. validate từ chối quantity.

### UT-442 CreateStoreDto name 1 ký tự

- Bước. validate(CreateStoreDto) với name là A.
- Expected. validate từ chối name vì MinLength 2.

### UT-443 CreateStoreDto name 2 ký tự

- Bước. validate(CreateStoreDto) với name là AB.
- Expected. validate không từ chối name.

### UT-444 CreateStoreDto name 120 ký tự

- Bước. validate(CreateStoreDto) với name dài 120.
- Expected. validate không từ chối name.

### UT-445 CreateStoreDto name 121 ký tự

- Bước. validate(CreateStoreDto) với name dài 121.
- Expected. validate từ chối name vì MaxLength 120.

### UT-446 CreateProductDto price âm

- Bước. validate(CreateProductDto) với price -1, name và sku hợp lệ.
- Expected. validate từ chối price vì Min 0.

### UT-447 CreateProductDto price 0

- Bước. validate(CreateProductDto) với price 0, name và sku dài 2.
- Expected. validate không từ chối price.

### UT-448 CreateProductDto stock âm

- Bước. validate(CreateProductDto) với stock -1.
- Expected. validate từ chối stock vì Min 0.

### UT-449 CreateProductDto status lạ

- Bước. validate(CreateProductDto) với status là ARCHIVED.
- Expected. validate từ chối status vì không thuộc ProductStatus.

### UT-450 CreateProductDto status DRAFT

- Bước. validate(CreateProductDto) với status DRAFT, field bắt buộc hợp lệ.
- Expected. validate không từ chối status.

### UT-451 AdjustInventoryDto quantity không integer

- Bước. validate(AdjustInventoryDto) với quantity 1.5.
- Expected. validate từ chối quantity vì IsInt.

### UT-452 AdjustInventoryDto quantity âm hợp lệ ở DTO

- Bước. validate(AdjustInventoryDto) với quantity -2.
- Expected. validate không từ chối. Âm quá tồn là việc của service, không phải DTO.

### UT-453 ProductImageDto position âm

- Bước. validate(ProductImageDto) với position -1, objectKey có.
- Expected. validate từ chối position vì Min 0.

### UT-454 PresignUploadDto thiếu fileName

- Bước. validate(PresignUploadDto) với chỉ có contentType.
- Expected. validate từ chối fileName.

### UT-455 PresignUploadDto contentType gif vẫn qua DTO

- Bước. validate(PresignUploadDto) với contentType image/gif, fileName a.gif.
- Expected. validate không từ chối. UploadsService mới từ chối loại ảnh.

### UT-456 RegisterWithRoleDto thiếu cả name và fullName

- Bước. email, password, role BUYER hợp lệ. Không gửi name và không gửi fullName.
- Expected. validate từ chối name và fullName. ValidateIf của mỗi field bật vì field kia trống.

### UT-457 RegisterWithRoleDto chỉ có fullName

- Bước. fullName là Nguyen Van A. Không gửi name. role SELLER.
- Expected. validate không từ chối name. fullName dài từ 2 đến 100 thì không có lỗi.

### UT-458 RegisterWithRoleDto role lạ

- Bước. role là ADMIN.
- Expected. validate từ chối role vì IsIn chỉ nhận BUYER và SELLER.

### UT-459 RegisterWithRoleDto role BUYER

- Bước. role BUYER, name An, email và password hợp lệ.
- Expected. validate không từ chối role.

### UT-460 RegisterWithRoleDto role SELLER

- Bước. role SELLER, name An, email và password hợp lệ.
- Expected. validate không từ chối role.

### UT-461 LoginDto email sai dạng

- Bước. email là buyer@.
- Expected. validate từ chối email.

### UT-462 LoginDto thiếu password

- Bước. chỉ có email hợp lệ.
- Expected. validate từ chối password.

### UT-463 LoginDto password ngắn vẫn qua DTO

- Bước. password là a, email hợp lệ.
- Expected. validate không từ chối password. LoginDto không có MinLength. Sai mật khẩu là việc của AuthService.

### UT-464 RefreshTokenDto thiếu token

- Bước. body rỗng.
- Expected. validate từ chối refreshToken.

### UT-465 UpdateProfileDto name 1 ký tự

- Bước. name là A.
- Expected. validate từ chối name vì Length 2 đến 100.

### UT-466 UpdateProfileDto avatarUrl không phải URL

- Bước. avatarUrl là not-a-url.
- Expected. validate từ chối avatarUrl.

### UT-467 UpdateProfileDto avatarUrl hợp lệ

- Bước. avatarUrl là https://cdn.example/a.png.
- Expected. validate không từ chối avatarUrl.

### UT-468 AddressDto thiếu city

- Bước. có recipientName, phone, line1, district. Không có city.
- Expected. validate từ chối city.

### UT-469 AddressDto isDefault không phải boolean

- Bước. isDefault là chuỗi true.
- Expected. validate từ chối isDefault vì IsBoolean.

### UT-470 CheckoutDto thiếu addressId

- Bước. chỉ có couponCode.
- Expected. validate từ chối addressId.

### UT-471 UpdateOrderStatusDto status lạ

- Bước. status là ARCHIVED.
- Expected. validate từ chối status vì không thuộc OrderStatus.

### UT-472 UpdateOrderStatusDto PAID qua enum

- Bước. status là PAID.
- Expected. validate không từ chối. Transition có hợp lệ hay không là việc của OrdersService.

### UT-473 CreateCouponDto percentOff 0

- Bước. percentOff 0.
- Expected. validate từ chối percentOff vì Min 1.

### UT-474 CreateCouponDto percentOff 1

- Bước. percentOff 1, code SALE.
- Expected. validate không từ chối percentOff.

### UT-475 CreateCouponDto percentOff 100

- Bước. percentOff 100, code SALE.
- Expected. validate không từ chối percentOff.

### UT-476 CreateCouponDto percentOff 101

- Bước. percentOff 101.
- Expected. validate từ chối percentOff vì Max 100.

### UT-477 CreateCouponDto fixedAmountOff âm

- Bước. fixedAmountOff -1.
- Expected. validate từ chối fixedAmountOff vì Min 0.

### UT-478 CreateCouponDto maxUses 0

- Bước. maxUses 0.
- Expected. validate từ chối maxUses vì Min 1.

### UT-479 CreateCouponDto expiresAt không phải ngày

- Bước. expiresAt là tomorrow.
- Expected. validate từ chối expiresAt vì IsDateString.

### UT-480 CreateWithdrawalDto amount 9999

- Bước. amount 9999, bankName, accountNumber, accountName có chữ.
- Expected. validate từ chối amount vì Min 10000.

### UT-481 CreateWithdrawalDto amount 10000

- Bước. amount 10000, ba field ngân hàng không rỗng.
- Expected. validate không từ chối amount.

### UT-482 CreateWithdrawalDto bankName rỗng

- Bước. bankName là chuỗi rỗng.
- Expected. validate từ chối bankName vì IsNotEmpty.

### UT-483 UpdateWithdrawalDto status lạ

- Bước. status là FOO.
- Expected. validate từ chối status vì không thuộc WithdrawalStatus.

## CatalogService

### UT-484 search chuỗi rỗng không lọc tên

- Bước. query.search là ''.
- Expected. where không có name contains vì chuỗi rỗng là falsy. where chỉ còn status ACTIVE.

## SellerCatalogService

### UT-485 createProduct không gửi compareAtPrice

- Bước. compareAtPrice là undefined.
- Expected. product.create không set compareAtPrice thành Decimal.

### UT-486 updateProduct thay cả bộ ảnh

- Bước. dto.images là một mảng mới.
- Expected. product.update images là deleteMany rồi create mảng mới.

## AuthService

### UT-487 hash dùng 12 vòng

- Bước. register thành công.
- Expected. hash được gọi với password và số vòng 12.

### UT-488 refresh hết hạn theo TTL

- Bước. refreshTtl là 2592000. createSession chạy.
- Expected. refreshToken.create expiresAt bằng now cộng 2592000 giây.

### UT-489 access và refresh khác type

- Bước. createSession chạy.
- Expected. access payload type là access và không có jti. refresh payload type là refresh và có jti.

## CartService

### UT-490 add chỉ tìm ACTIVE

- Bước. Gọi add.
- Expected. product.findFirst where gồm id và status ACTIVE.

## PaymentsService

### UT-491 IPN tạo ví theo seller của store

- Bước. IPN thành công, seller chưa có ví.
- Expected. sellerWallet.upsert where.sellerId bằng payment.order.store.sellerId.

## OrdersService checkout

### UT-492 Chép địa chỉ giao hàng

- Bước. Checkout hợp lệ. Address có recipientName, phone, line1, line2, ward, district, city, postalCode.
- Expected. shippingAddress chứa đúng tám field đó. Không chứa userId và không chứa id.

## SellerCatalogService

### UT-493 createStore chuyển description và logo

- Bước. dto có description và logoKey. Seller chưa có store.
- Expected. store.create data.description và logoKey bằng dto.

## CatalogService

### UT-494 products sắp mới nhất trước

- Bước. Gọi products({}).
- Expected. orderBy createdAt desc.

## CartService

### UT-495 get chỉ lấy một ảnh đầu

- Bước. Gọi get.
- Expected. include items.product.images orderBy position asc và take 1.

## AuthService

### UT-496 logout hash trước khi update

- Bước. Gọi logout với raw token abc.
- Expected. updateMany where.tokenHash bằng sha256 hex của abc.

## OrdersService cancel

### UT-497 Hủy hoàn đúng số lượng

- Bước. Đơn PENDING_PAYMENT, item quantity 2, productId p1.
- Expected. changeStatusAndRestock hoàn tồn product p1 cộng 2 và ghi inventory RETURN.

## OrdersService sellerUpdate

### UT-498 Seller hủy cũng hoàn tồn

- Bước. sellerUpdate từ PAID sang CANCELLED.
- Expected. Không chỉ đổi status. Phải hoàn tồn như cancel của buyer.

## PaymentsService

### UT-499 create không có payment cũ

- Bước. Không có payment. MoMo resultCode 0.
- Expected. requestId là UUID mới. payment.create amount bằng totalAmount của đơn.

## OrdersService checkout

### UT-500 Hai dòng cùng store được cộng subtotal

- Bước. Hai item cùng store, giá 10000 số lượng 2 và giá 5000 số lượng 1.
- Expected. subtotal bằng 25000. shippingAmount bằng 30000 vì dưới 500000. totalAmount bằng 55000 khi không coupon.
