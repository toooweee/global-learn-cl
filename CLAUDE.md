# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

`global-learn-api` — corporate LMS backend (NestJS + Prisma + PostgreSQL + Redis + MinIO/S3). Package manager is **pnpm** (lockfile is `pnpm-lock.yaml`, Node version pinned by `.nvmrc`).

Bounded contexts wired today: **identity** (`auth`, `user`, `role`, `token`), **organization** (`department`, `division`, `position`), **employee**, **education** (`course`, `course-application`, `enrollment`, `lesson`, `test-definition`, `test-attempt`, `certificate`), **onboarding** (`template`, `assignment`, `chat`), **files**, **notifications**, plus cross-cutting **mail** and a WebSocket **gateway**. See `CHECKLIST.md` for the full per-module endpoint catalog (roles, response shapes, gaps).

## Common commands

```bash
pnpm install --frozen-lockfile
pnpm start:dev                   # nest start --watch
pnpm build                       # nest build && tsc-alias  (tsc-alias is required — rewrites @/* paths in dist)
pnpm start:prod                  # node dist/main
pnpm lint                        # eslint --fix on {src,apps,libs,test}/**/*.ts
pnpm format
pnpm test                        # jest (rootDir = src, *.spec.ts)
pnpm test -- path/to/file.spec.ts        # single file
pnpm test -- -t "name of test"           # by test name
pnpm test:e2e                    # uses test/jest-e2e.json
pnpm prisma migrate dev --name <name>
pnpm prisma generate             # client emits to ./generated/prisma (NOT node_modules)
make dev                         # install + docker compose up + wait-db + migrate deploy + generate
```

Local infra (`docker-compose.yaml` + `docker-compose.local.yaml`) brings up Postgres (host port `5434`), Redis, RedisInsight (`5540`), MailHog (`1025`/`8025`), and MinIO (S3 object storage). `.env` is required — copy from `.env.example`.

## Architecture

The codebase follows a DDD + CQRS layering. Each domain module under `src/modules/<bounded-context>/<aggregate>/` is sliced into:

- `domain/` — entities/aggregates extending `libs/ddd/entity.base.ts`. `Entity` has a `protected` constructor (subclasses also use `protected`) and exposes the props through a frozen `getProps()`. Subclasses provide **two** static factories: `create(props)` for brand-new aggregates (generates the `id` via `randomUUID()` and stamps `createdAt`/`updatedAt`), and `recreate({ id, props })` for hydration from persistence (used by the mapper's `toDomain`).
- `application/` — use cases dispatched via **`@nestjs/cqrs`**. Commands extend `libs/application/command.base.ts` (`Command implements ICommand`, auto-fills `id`, `correlationId` from `RequestContextService`, and `timestamp`); queries extend `libs/application/query.base.ts` (plain `Query` with `correlationId` + `timestamp`, or `PaginatedQuery` for list endpoints — pre-computes `offset` from `limit`/`page` and defaults `orderBy` to `{ field: true, param: 'desc' }`, where `field: true` means "use the handler's default field"). Each use case is a sibling pair `*.command.ts` + `*.command-handler.ts` (and `*.query.ts` + `*.query-handler.ts`); the handler class is decorated with `@CommandHandler(MyCommand)` / `@QueryHandler(MyQuery)` and `implements ICommandHandler<MyCommand, TResult>` / `IQueryHandler<...>`. Controllers never inject handlers directly — they dispatch through `CommandBus.execute(...)` / `QueryBus.execute(...)`. **`CqrsModule.forRoot()` is registered globally in `AppModule`**, so feature modules generally do not re-import it (the older `OnboardingModule` still imports it explicitly; newer modules like `UserModule` rely on the global registration). Repository **ports** (interfaces) live here under `application/ports/` or `*.repository.port.ts`.
- `infra/` — Prisma repository adapters extending `infra/prisma/prisma.repository.base.ts`.
- `presentation/` — Nest controllers + a `dto/` subfolder with class-validator request DTOs and class-based response DTOs.

`<aggregate>.types.ts` at the module root defines `Props` (full shape, incl. timestamps), `CreateProps` (input to `Entity.create`), and `RecreateProps` (`{ id; props }` — input to `Entity.recreate`).

### Mappers

Each aggregate has an `@Injectable()` `<Aggregate>Mapper` at the module root (e.g. `src/modules/identity/user/user.mapper.ts`, `src/modules/onboarding/template/template.mapper.ts`). `libs/ddd/mapper.interface.ts` exposes the full `Mapper<DomainEntity, DbRecord, ResponseDto>` (three methods) **and** three smaller pieces: `ToDomain`, `ToPersistence`, `ToResponse`. Flat aggregates (User) implement the full `Mapper`. Tree aggregates (Onboarding template / assignment / chat) implement just `ToDomain` — `toPersistence` doesn't fit a single shape for nested create-vs-update and is inlined in the repo; `toResponse` is added only when a read-side endpoint actually needs it.

- `toDomain(record)` — hydrates an entity via `Entity.recreate({ id, props })`.
- `toPersistence(entity)` — flattens the entity to a Prisma row (when applicable).
- `toResponse(entity)` — constructs a presentation-layer `ResponseDto` (when applicable).

The mapper is registered in the module's `providers` (alongside the repo binding and handlers) and injected into the Prisma repository.

**Always type `DbRecord` from `@generated/client`** — never hand-roll record shapes. For flat aggregates, import the model type directly (e.g. `import { User } from '@generated/client'`). For tree aggregates with nested `include`, export an `<aggregate>Include` constant from the mapper using `satisfies Prisma.<Model>Include` and derive `<Aggregate>Record = Prisma.<Model>GetPayload<{ include: typeof <aggregate>Include }>`. The repository imports both — uses the constant in `findUnique({ include })` calls, the type in the mapper signature. Example: `src/modules/onboarding/template/template.mapper.ts` exports `onboardingTemplateInclude` and `OnboardingTemplateRecord`. This keeps Prisma queries and mapper input in sync — if you add a relation to the include, the type expands and `toDomain` stops compiling until you handle the new field.

### Read-side queries can bypass the repository

Command handlers go through the repository + mapper (write side). Query handlers may either go through the repo or **inject `PrismaService` directly** and return raw Prisma records — the controller then wraps them in a response DTO. `FindUserQueryHandler` and `FindUsersQueryHandler` are the current examples: they hit `PrismaService.client.user.*` and return `User` (or `Paginated<User>`) rather than `UserEntity`. Pick the direct path for simple lookups/lists; reach for the repo when domain invariants or transactions are involved.

### Request context + transactions

Both request correlation and Prisma transaction propagation ride on the same `AppRequestContext` (`src/libs/application/context/app-request-context.ts`), exposed via the static `RequestContextService`. Two fields live on it: `requestId: string` and `prismaTransaction?: PrismaTransactionClient`.

1. **`ContextInterceptor`** (registered as `APP_INTERCEPTOR` in `AppModule`) runs on every HTTP request:
   - Resolves a `requestId` from (in order) `req.body.requestId`, the `x-request-id` header, or a freshly minted `nanoid(6)`, and stashes it via `RequestContextService.setRequestId(...)`.
   - Logs request start/end with method, URL, status, and elapsed ms — all prefixed with `[<requestId>]`.
2. **Command/Query base classes** read `RequestContextService.getRequestId()` at construction time and attach it as `metadata.correlationId`, so every dispatched message carries the same id as the HTTP log line.
3. **`PrismaService`** also logs every SQL statement; the `[<requestId>]` prefix comes from `AppLogger` (see «Logger» below), so request ↔ command ↔ SQL all trace together.
4. **`PrismaRepositoryBase.transaction(handler)`** opens a Prisma `$transaction`, stashes the `tx` client on the context via `RequestContextService.setTransactionConnection`, runs `handler`, then clears it in a `finally`.
5. Inside `PrismaRepositoryBase`, the `db` getter returns the context's `tx` if present, else the singleton `PrismaService.client`. **Always read through `this.db`, never `this.prismaService.client` directly**, otherwise the repo escapes the active transaction. (Note: existing repos like `UserPrismaRepository` currently access `this.prismaService.client.user.*` — that's a bug to watch out for when copying patterns. New repository methods should use `this.db.<model>.*`.)

Command handlers compose multiple repository calls inside a single `repo.transaction(async () => { ... })` block; sibling repos in the same request automatically see the same `tx`.

### Exceptions

Two domain-specific error classes, both carrying `statusCode` + `code`:

- `DomainException` (`src/libs/ddd/domain.exception.ts`) — defaults `400` / `DOMAIN_VALIDATION_EXCEPTION`. Throw from entity invariants.
- `ApplicationException` (`src/libs/application/exceptions/application.exception.ts`) — defaults `500` / `APPLICATION_EXCEPTION`. Throw from command/query handlers for use-case-level failures (auth, conflicts, not-found, …). **Constructor order is `(message, statusCode, code)`** — easy to invert.

`AllExceptionsFilter` (registered as `APP_FILTER` in `AppModule`) catches everything and returns a uniform JSON body:

```json
{ "statusCode": 409, "code": "USER_ALREADY_EXISTS", "message": "User already exists",
  "timestamp": "...", "path": "/user", "correlationId": "abc123" }
```

It special-cases `DomainException`, `ApplicationException`, and Nest's `HttpException` (joining array validation messages); anything else collapses to `500 INTERNAL_SERVER_ERROR`. The filter also logs the exception with the current `correlationId`.

### Prisma service

`PrismaService` (`src/infra/prisma/prisma.service.ts`) constructs a single `PrismaClient` against the **`@prisma/adapter-pg`** driver adapter (`PrismaPg({ connectionString: DATABASE_URL })`) and exposes it as `client`. It connects in `onModuleInit`, disconnects in `onModuleDestroy`, and wires the `query` event to log every SQL statement with the SQL, the params, and the duration. The `[<requestId>]` prefix is added automatically by `AppLogger`.

### Logger

`AppLogger` (`src/infra/logger/app.logger.ts`) extends Nest's `ConsoleLogger` and overrides `log`/`error`/`warn`/`debug`/`verbose` to prepend `[<requestId>]` to string messages, reading `requestId` from `RequestContextService.getRequestId()`. If there's no active request context (bootstrap-time logs), the prefix is skipped. Wired in `main.ts` via `app.useLogger(new AppLogger())` with `bufferLogs: true` so the early bootstrap lines are not lost. **Do not manually inline `[${requestId}]` in log messages** — the logger does it for you.

### Swagger

`setupSwagger(app)` (`src/infra/configs/swagger.config.ts`) mounts the Swagger UI at **`/api/docs`** with `persistAuthorization: true`. Use `@ApiOperation`, `@ApiOkResponse`, `@ApiCreatedResponse`, `@ApiPaginatedResponse(Model)`, `@ApiNotFoundResponse`, `@ApiConflictResponse`, etc. on controllers. Tag controllers with `@ApiTags('<group>')` so they group in the UI.

### Auth & guards

Authentication is **cookie-based JWT**, not `Authorization` headers. `AuthModule` issues an access + refresh token pair on login (`TokenService`, signed with `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET`); the controller writes them as httpOnly cookies via `cookieFactory` (`cookieConstants.ACCESS_TOKEN` / `REFRESH_TOKEN`). Refresh tokens are persisted per-device (`tokens` table, keyed by `userAgent`) so logout/refresh are device-scoped.

Two **global** `APP_GUARD`s (order matters — registered in `AppModule`):

1. **`JwtAuthGuard`** (`src/libs/auth/guards/jwt-auth.guard.ts`) — runs on every request unless the handler/class is marked `@Public()` (`IS_PUBLIC_KEY` metadata). Reads the access-token cookie, verifies it, and stashes `payload.sub` / `payload.role` on the request context via `RequestContextService.setUserId` / `setUserRole`. Throws `ApplicationException(401, 'UNAUTHORIZED')` when missing/invalid. **So every endpoint requires auth by default** — opt out with `@Public()`.
2. **`RolesGuard`** (`src/libs/auth/guards/roles.guard.ts`) — enforces `@Roles(...)` metadata against the role on the context. No `@Roles` ⇒ any authenticated user.

Helpers in `src/libs/auth/`:
- `@Public()` — bypass `JwtAuthGuard`.
- `@Roles('admin', 'division_head', …)` — restrict to roles. Role slugs live in `roles.constants.ts` (`ROLE.ADMIN = 'admin'`, `DEPARTMENT_HEAD`, `DIVISION_HEAD`, `SENIOR_MANAGER`, `MANAGER`) plus the role-bundle constants (`COURSE_CREATOR_ROLES`, `COURSE_ASSIGNER_ROLES`, `MANAGERIAL_ROLES`) and `roleFromPositionName(...)`.
- `@CurrentUser()` — injects `{ userId, role }` (`CurrentUserPayload`) read from the request context.

> **Role slugs are lowercase** (`admin`, `division_head`, …). Comparing against capitalized literals (e.g. `user.role !== 'Admin'`) is a bug — see `CHECKLIST.md` cross-cutting notes.

WebSocket gateways (`socket.io`, `src/infra/gateway/`) authenticate separately: the client passes the JWT in `handshake.auth.token`, the gateway verifies it with `JwtService` and disconnects on failure. `OnboardingChatGateway` (namespace `chat`) rooms by `chat:<chatId>` and emits `message:created`; `NotificationsGateway` pushes per-user notifications.

### Other conventions

- Path alias `@/*` → `src/*`; `@generated` / `@generated/*` → `generated/prisma`. Build relies on **`tsc-alias`** to rewrite these in emitted JS — don't drop it from the `build` script.
- Env access goes through `EnvService.get(...)` backed by `EnvSchema` (Zod) in `src/infra/env/env.ts` (current vars: `PORT`; `REDIS_IP`, `REDIS_PORT`; `DATABASE_URL`; `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `JWT_ACCESS_TTL`, `JWT_REFRESH_TTL`; `SMTP_HOST`, `SMTP_PORT`, `SMTP_FROM`; `APP_URL`, `FRONTEND_URL` (used to build invite / password-reset links in emails); `TEST_ADMIN_EMAIL`, `TEST_ADMIN_PASSWORD`, `TEST_EMPLOYEE_EMAIL`, `TEST_EMPLOYEE_PASSWORD` (seed + e2e creds); `MINIO_ENDPOINT`, `MINIO_ROOT_USER`, `MINIO_ROOT_PASSWORD`, `MINIO_BUCKET_NAME`, `MINIO_REGION`). Validation is wired through `ConfigModule.forRoot({ validate: (env) => EnvSchema.parse(env) })` in `EnvModule`. Add new variables to the schema; never read `process.env` directly in app code. **`zod` is used only for env validation** — do not pull it into HTTP layer.
- `oxide.ts` `Option<T>` is the convention for nullable repo lookups (`findById`, `findByEmail`, etc. return `Option<Entity>`).
- HTTP DTOs use **`class-validator` + `class-transformer`**. A global `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })` and `ClassSerializerInterceptor` are wired in `src/main.ts`. Request DTOs live in `presentation/dto/*.request.dto.ts`; controllers accept them with bare `@Body() dto: SomeDto` / `@Param() dto: ...` / `@Query() dto: ...` (the pipe transforms+validates).
- **Response DTO classes live in `src/libs/api/dto/`** and use plain explicit constructors (no `@Exclude()`/`@Expose()` — only fields assigned in the constructor make it to the wire). Conventions: `IdResponseDto` for create endpoints, `BaseResponseDto` (`id`, `createdAt`, `updatedAt` — extends `IdResponseDto`, ISO-serializes dates) as a base for resource read-models, `PaginatedResponseDto<T>` wrapping the repo's `Paginated<T>` shape (`count` / `limit` / `page` / `data`). Per-aggregate response DTOs live next to the controller in `presentation/dto/<thing>.response.dto.ts` and extend `BaseResponseDto`.
- **Shared request DTOs** live in `src/libs/api/dto/`: `IdRequestDto` for `:id` path params (validates UUID), `PaginatedQueryRequestDto` for `?limit&page` query strings (coerced to numbers via `@Type(() => Number)`).
- **Swagger helper**: `@ApiPaginatedResponse(Model)` from `src/libs/api/decorators/` produces the `allOf: [PaginatedResponseDto, { data: Model[] }]` schema — use it on list endpoints instead of writing the schema inline.
- **Order-by helper**: `parsePrismaOrderBy(orderBy, defaultField = 'createdAt')` in `src/infra/prisma/` turns `PaginatedQuery.orderBy` (`{ field: string | true; param: 'asc' | 'desc' }`) into Prisma's `{ [field]: param }`. When `field === true` it falls back to the handler-supplied `defaultField`.
- Inject types from repository ports with `import type` to avoid TS1272 (decorator metadata + `isolatedModules`); inject the DI token (e.g. `USER_REPOSITORY`, `ONBOARDING_REPOSITORY` — exported `Symbol`s alongside the port interface) with `@Inject(...)`.
- IDs are `randomUUID()` generated inside the entity's static `create()` factory (not the constructor); `AggregateId` is just `string`.
- **Password hashing** uses `argon2` (see `CreateUserCommandHandler`).

### Module wiring

`AppModule` imports `CqrsModule.forRoot()`, `ScheduleModule.forRoot()` (`@nestjs/schedule` — cron jobs), `RequestContextModule`, `EnvModule`, `PrismaModule`, plus every feature module: `UserModule`, `AuthModule`, `RoleModule`, `OrganizationModule`, `EmployeeModule`, `OnboardingModule`, `FilesModule`, `EducationModule`, `GatewayModule`, `NotificationModule`, `MailModule`. It registers `ContextInterceptor` as `APP_INTERCEPTOR`, `AllExceptionsFilter` as `APP_FILTER`, and **two global `APP_GUARD`s — `JwtAuthGuard` then `RolesGuard`** (see «Auth & guards» below). When adding a new module, import it into `AppModule`.

`OrganizationModule` and `EducationModule` are umbrella modules: each registers the controllers/handlers/mappers for several sibling aggregates (organization → department/division/position; education → course/course-application/enrollment/lesson/test-definition/test-attempt/certificate). `GatewayModule` is `@Global()` and exports `NotificationsGateway` + `OnboardingChatGateway` (socket.io); `MailModule` sends transactional email via SMTP (MailHog locally).

> **`UserModule`** (`src/modules/identity/user/`) is the canonical small example: imports `PrismaModule` only (CQRS is global from `AppModule`); binds `USER_REPOSITORY` `Symbol` → `UserPrismaRepository`; registers `CreateUserCommandHandler`, `FindUserQueryHandler`, `FindUsersQueryHandler`, and `UserMapper` as providers; exposes `UserController` which dispatches via `CommandBus` / `QueryBus`. The repository port is `UserRepositoryPort extends RepositoryPort<UserEntity>` and adds `findByEmail(email): Promise<Option<UserEntity>>`. Files at the module root: `user.module.ts`, `user.types.ts` (props), `user.mapper.ts`.

> **`OnboardingModule`** (`src/modules/onboarding/`) carries three aggregates in one Nest module: `template/`, `assignment/` (the running onboarding), and `chat/`. The three repository ports are bound to Prisma adapters via `Symbol` tokens (`ONBOARDING_TEMPLATE_REPOSITORY`, `ONBOARDING_REPOSITORY`, `ONBOARDING_CHAT_REPOSITORY`); the three mappers (`OnboardingTemplateMapper`, `OnboardingMapper`, `OnboardingChatMapper`) are `@Injectable()` and registered in `providers`. The module imports only `PrismaModule` (CQRS is global from `AppModule`). Handlers are decorated with `@CommandHandler(...)` and registered in `providers`. Controllers inject `CommandBus` (never the handlers directly). Entities use the unified `protected constructor(CreateEntityProps<...>)` + static `create` / `recreate` style, and throw `DomainException` for invariants (e.g. `ONBOARDING_STEP_OUT_OF_ORDER`, `ONBOARDING_CHAT_SENDER_FORBIDDEN`).

## Database schema

Tables are grouped by bounded context. All PKs are `uuid`, all timestamps are `timestamptz`. The `@map`/`@@map` directives in `prisma/schema.prisma` give the actual `snake_case` table/column names.

### Identity (`users`, `roles`, `tokens`)

- **`users`** — base account. Holds credentials (`email`, `hashed_password`) plus password-reset fields (`password_reset_token`, `password_reset_expires_at`), and is the 1:1 parent of `employees` via a shared PK. **A user has exactly one role** via `role_id` FK (`onDelete: Restrict`) — there is **no `user_roles` join table** any more (the role is single-valued). Cascade-deletes the `employee`, `tokens`, and `notifications` tied to the account.
- **`roles`** — named application roles. Unique on `name`. Slugs match `roles.constants.ts` (`admin`, `department_head`, `division_head`, `senior_manager`, `manager`). One role → many users.
- **`tokens`** — persisted refresh tokens, one per device. `hashed_token`, `user_agent`, `expires_at`; unique `(user_id, user_agent)` so re-login on the same device rotates the row; cascades on user delete. This is how logout/refresh stay device-scoped.

> There are **no `clients` / `client_companies` tables** — the schema is internal-employee-only at present.

### Organization (`departments`, `divisions`, `positions`, `employees`)

- **`departments`** — top-level org unit. Unique on `name`; has `is_active`.
- **`divisions`** — sub-unit under a department. FK → `departments.id`; has `is_active`.
- **`positions`** — job titles, now a **self-referential hierarchy**: `parent_id` → `positions.id` (`onDelete: SetNull`, relation `PositionHierarchy`). Drives the org-chart tree endpoints (`GET /positions/tree`, `/employees/me/subordinates/tree`). An employee references at most one position.
- **`employees`** — internal staff profile. PK is also the FK to `users.id` (1:1 with the account). Carries `division_id` (required), `position_id` (optional), `birth_date`, `employment_date`/`dismissal_date` (dismissal = soft delete), `avatar_id`, `biography`. Many feature aggregates point at `employees.id`: course authorship, enrollments (and `assigned_by`), course applications, test attempts, onboarding (assigner + assignee), chat messages, and certificates.

### Files (`files`)

- **`files`** — single store for uploaded blobs (just `url`, the S3/MinIO object key). Other tables reference it via `*_id` columns (course covers, employee avatars, onboarding template & step covers). All FKs use `ON DELETE SET NULL` so deleting a file never cascades into business data. The actual object lives in MinIO; controllers hand out presigned URLs.

### Education (`courses`, `modules`, `steps`, `lessons`, `tests`, `course_questions`, `course_answers`, `test_questions`, `test_attempts`, `test_attempt_answers`, `course_applications`, `course_enrollments`, `step_progress`, `course_certificates`)

- **`courses`** — top-level learnable unit. `author_id` → `employees.id`; optional `cover_id` → `files.id` (SET NULL). Carries a **publication workflow**: `status` (`course_status` enum: `DRAFT` → `PENDING_REVIEW` → `PUBLISHED` / `REJECTED`, default `PUBLISHED`) with `review_note` for rejections, plus `is_archived`. **Visibility** is governed by `scope` (`course_scope` enum: `ALL` / `DEPARTMENT` / `DIVISION`) with optional `department_id` / `division_id` (both SET NULL). Owns `modules`, `course_questions`, `course_enrollments`, `course_applications`, `course_certificates` (all cascade). Also referenced by `onboarding_template_steps` / `onboarding_steps` when a step is course-based.
- **`modules`** — ordered sub-sections of a course. Unique `(course_id, position)` enforces a single ordering.
- **`steps`** — ordered units inside a module. `type` (`step_type` enum: `LESSON` or `TEST`) plus an optional `lesson_id` / `test_id` (both SET NULL when the referenced lesson/test is removed). Unique `(module_id, position)`.
- **`lessons`** — reusable lesson content referenced by `steps.lesson_id`.
- **`tests`** — reusable test definitions; referenced by `steps.test_id` and by `test_attempts`.
- **`course_questions`** — pool of questions belonging to a course, optionally scoped to a specific module. Source of truth for both display in modules and for test composition.
- **`course_answers`** — answer options for a `course_question`, with `is_correct` flag.
- **`test_questions`** — which questions a particular test pulls in. Unique `(test_id, question_id)` prevents duplicates.
- **`test_attempts`** — one row per "an employee opened this test". Closed when `ended_at` is set. Indexed on `(employee_id, test_id)` for "have they passed yet" queries.
- **`test_attempt_answers`** — per-question response within an attempt. Holds the chosen `answer_id` plus the literal `option` text snapshot.
- **`course_applications`** — an employee's self-request to take a course. `status` (`application_status` enum: `PENDING` / `APPROVED` / `REJECTED`); unique `(course_id, employee_id)`. Approval typically spawns an enrollment.
- **`course_enrollments`** — an employee enrolled in a course. Unique `(course_id, employee_id)` ensures a single live enrollment row; carries optional `assigned_by_id` (the manager who enrolled them, SET NULL), `current_step_id`, `status` (`enrollment_status` enum: `IN_PROGRESS` / `COMPLETED` / `CANCELLED`), `started_at`, `completed_at`. Cascades from course or employee deletion. A completed enrollment has a 1:1 `course_certificate`.
- **`step_progress`** — per-step completion record under an enrollment. Unique `(step_id, enrollment_id)` so each step has at most one progress row per enrollment.
- **`course_certificates`** — issued on course completion. `enrollment_id` is `UNIQUE` (1:1 with the enrollment); also denormalizes `employee_id` / `course_id` and `issued_at`. Optional `file_id` → `files.id` (SET NULL) points at the generated PDF: on completion `CertificateIssuerService` renders a PDF (`CertificatePdfService` via `pdfkit` + bundled DejaVu Sans for Cyrillic), uploads it to MinIO and links it (best-effort — a render/storage failure never blocks completion). Read endpoints return a presigned `fileUrl`. Fetchable publicly by id for verification.

### Onboarding (`onboarding_templates`, `onboarding_template_steps`, `onboarding_template_step_feedback_options`, `onboardings`, `onboarding_steps`, `onboarding_step_feedback_options`, `onboarding_step_feedback_selections`, `onboarding_chats`, `onboarding_chat_messages`)

The onboarding feature has two halves: a **template** side (curriculum authored by managers, one per role) and an **assignment** side (a snapshot taken when the template is given to an employee). The assignment side is fully self-contained — editing or deleting a template after the fact never mutates an in-flight onboarding.

- **`onboarding_templates`** — curriculum scoped to a specific role inside a specific division. Unique `(position_id, division_id)` enforces "one template per role", which lets `OnboardingTemplateRepository.findForRole(positionId, divisionId)` resolve the right template. Optional `cover_id` → `files.id`.
- **`onboarding_template_steps`** — ordered steps in the template. `type` (`onboarding_step_type` enum: `TEXT` or `COURSE`); `course_id` is optional (only set when `type = COURSE`, SET NULL if the course is later deleted). `recommended_start_offset_days` / `recommended_end_offset_days` are integer day-offsets from the onboarding start, materialized into concrete dates at assignment time. Unique `(template_id, position)`. Cascade-deleted with the template.
- **`onboarding_template_step_feedback_options`** — the predefined "what was done" checklist labels per template step (the "селекты" feedback). Copied into the assigned onboarding at assign time. Cascade-deleted with the step.
- **`onboardings`** — one assigned onboarding. `template_id` is nullable + SET NULL so deleting a template doesn't break in-flight runs. `assigned_by` and `assigned_to` are both → `employees.id` (the manager who assigned it and the employee going through it — supports new hires and promotions alike). `status` (`onboarding_status` enum: `IN_PROGRESS` / `COMPLETED` / `CANCELLED`), `start_date` / `end_date` (the absolute window), `completed_at`. Indexed on `(assigned_to, status)` for the "my active onboardings" view.
- **`onboarding_steps`** — materialized snapshot of the steps for this assignment. Carries the resolved `recommended_start_date` / `recommended_end_date` (no longer offsets), `completed_at` (null = pending), and `feedback_text` (the free-form note left when the step is closed). Unique `(onboarding_id, position)`. Cascade-deleted with the onboarding.
- **`onboarding_step_feedback_options`** — the snapshot of the template's feedback labels for this step. Decoupled from the template so editing the template later doesn't rewrite history.
- **`onboarding_step_feedback_selections`** — which of those options the employee actually ticked. Composite PK `(step_id, option_id)` so each option is selected at most once. The domain rule (in `OnboardingEntity.completeCurrentStep`) blocks advancing to the next step until at least one selection or `feedback_text` is recorded.
- **`onboarding_chats`** — one chat per assigned onboarding. `onboarding_id` is `UNIQUE` (1:1 with the onboarding) and the chat is created in the same transaction as the assignment. Cascade-deleted with the onboarding.
- **`onboarding_chat_messages`** — chat history. `sender_id` → `employees.id`; the application-layer rule restricts senders to the assignment's `assigned_by` / `assigned_to`. Indexed on `(chat_id, created_at)` for ordered pagination. `read_at` tracks read receipts.

### Notifications (`notifications`)

- **`notifications`** — generic per-user in-app notification. `type` is a free-form discriminator, `payload` is `jsonb`. Indexed on `(user_id, read_at)` so the unread count is a fast lookup.

## Tooling guardrails

- Husky + lint-staged: pre-commit runs `eslint --fix` and `prettier --write` on staged `*.ts` / `*.json`.
- Commits must follow Conventional Commits (commitlint with `@commitlint/config-conventional`).
- CI (`.github/workflows/ci.yaml`) runs `pnpm lint`, `pnpm build`, `pnpm test` on push to `main`/`dev` and PRs to `main`.
