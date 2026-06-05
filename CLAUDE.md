# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

`global-learn-api` — corporate LMS backend (NestJS + Prisma + PostgreSQL + Redis). Package manager is **pnpm** (lockfile is `pnpm-lock.yaml`, Node version pinned by `.nvmrc`).

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

Local infra (`docker-compose.yaml` + `docker-compose.local.yaml`) brings up Postgres (host port `5434`), Redis, RedisInsight (`5540`), and MailHog (`1025`/`8025`). `.env` is required — copy from `.env.example`.

## Architecture

The codebase follows a DDD + CQRS layering. Each domain module under `src/modules/<bounded-context>/<aggregate>/` is sliced into:

- `domain/` — entities/aggregates extending `libs/ddd/entity.base.ts` (private constructor + static `create`, props frozen via `getProps()`).
- `application/` — use cases dispatched via **`@nestjs/cqrs`**. Commands extend `libs/application/command.base.ts` (`Command implements ICommand`, auto-fills `correlationId` from request context); queries extend `libs/application/query.base.ts` (`Query implements IQuery`). Each use case is a sibling pair `*.command.ts` + `*.command-handler.ts`; the handler class is decorated with `@CommandHandler(MyCommand)` and `implements ICommandHandler<MyCommand, TResult>`. Controllers never inject handlers directly — they dispatch through `CommandBus.execute(...)` / `QueryBus.execute(...)`. Each module that uses handlers must `imports: [CqrsModule]`. Repository **ports** (interfaces) live here under `application/ports/` or `*.repository.port.ts`.
- `infra/` — Prisma repository adapters extending `infra/prisma/prisma.repository.base.ts`.
- `presentation/` — Nest controllers + a `dto/` subfolder with class-validator DTOs.

`<aggregate>.types.ts` at the module root defines `Props` (full shape, incl. timestamps) and `CreateProps` (input to `Entity.create`).

### Request-scoped transactions

Transaction propagation is implicit, not parameter-passed:

1. `ContextInterceptor` (`APP_INTERCEPTOR` in `AppModule`) puts an `AppRequestContext` on every request via `nestjs-request-context`.
2. `PrismaRepositoryBase.transaction(handler)` opens a Prisma `$transaction`, stashes the `tx` client on the context via `RequestContextService.setTransactionConnection`, runs `handler`, then clears it.
3. Inside `PrismaRepositoryBase`, the `db` getter returns the context's `tx` if present, else the singleton `PrismaService.client`. **Always read through `this.db`, never `this.prismaService.client` directly**, otherwise the repo escapes the active transaction.

Command handlers compose multiple repository calls inside a single `repo.transaction(async () => { ... })` block; sibling repos in the same request automatically see the same `tx`.

### Other conventions

- Path alias `@/*` → `src/*`; `@generated` / `@generated/*` → `generated/prisma`. Build relies on **`tsc-alias`** to rewrite these in emitted JS — don't drop it from the `build` script.
- Env access goes through `EnvService.get(...)` backed by `EnvSchema` (Zod) in `src/infra/env/env.ts`. Add new variables to the schema; never read `process.env` directly in app code. **`zod` is used only for env validation** — do not pull it into HTTP layer.
- `oxide.ts` `Option<T>` is the convention for nullable repo lookups (`findById` returns `Option<Entity>`).
- HTTP DTOs use **`class-validator` + `class-transformer`**. A global `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })` and `ClassSerializerInterceptor` are wired in `src/main.ts`. DTOs live in `presentation/dto/*.dto.ts`; controllers accept them with bare `@Body() dto: SomeDto` (the pipe transforms+validates).
- Response classes live in `src/libs/application/` and use class-level `@Exclude()` + per-field `@Expose()` so unmarked fields don't leak. Conventions: `IdResponseDto` for create endpoints, `BaseResponseDto` (`id`, `createdAt`, `updatedAt`) as a base for resource read-models, `PaginatedResponseDto<T>` wrapping the repo's `Paginated<T>`.
- Inject types from repository ports with `import type` to avoid TS1272 (decorator metadata + `isolatedModules`); inject the DI token (e.g. `ONBOARDING_REPOSITORY` `Symbol`) with `@Inject(...)`.
- IDs are `randomUUID()` generated inside the entity constructor; `AggregateId` is just `string`.

### Module wiring

`AppModule` imports the modules that are wired up so far (currently `UserModule` and `OnboardingModule` plus infra modules `EnvModule`, `PrismaModule`, `RequestContextModule`). Many feature modules under `src/modules/education/*`, `employee`, `identity/auth`, `identity/token` exist as in-progress slices and are not all registered yet — when adding a new module, import it into `AppModule`.

> Heads up — `OnboardingModule` (in `src/modules/onboarding/`) carries three aggregates in one Nest module: `template/`, `assignment/` (the running onboarding), and `chat/`. The three repository ports are bound to Prisma adapters via `Symbol` tokens (`ONBOARDING_TEMPLATE_REPOSITORY`, `ONBOARDING_REPOSITORY`, `ONBOARDING_CHAT_REPOSITORY`). The module imports `CqrsModule`; handlers are decorated with `@CommandHandler(...)` and registered in `providers`. Controllers inject `CommandBus` (never the handlers directly).

## Database schema

Tables are grouped by bounded context. All PKs are `uuid`, all timestamps are `timestamptz`. The `@map`/`@@map` directives in `prisma/schema.prisma` give the actual `snake_case` table/column names.

### Identity (`users`, `roles`, `user_roles`)

- **`users`** — base account. Holds credentials (`email`, `hashed_password`) and is the parent of every persona table (`employees`, `clients`) via a shared PK. Cascade-deletes everything tied to the account.
- **`roles`** — named application roles (admin, manager, employee, …). Unique on `name`.
- **`user_roles`** — many-to-many join. Composite PK `(user_id, role_id)`; both sides cascade so deleting a user or role tears down assignments.

### Organization (`departments`, `divisions`, `positions`, `employees`, `client_companies`, `clients`)

- **`departments`** — top-level org unit (e.g. "Engineering"). Unique on `name`.
- **`divisions`** — sub-unit under a department (e.g. "Platform"). FK → `departments.id`.
- **`positions`** — job titles (e.g. "Backend Engineer"). Pure dictionary; an employee references at most one.
- **`employees`** — internal staff profile. PK is also the FK to `users.id` (1:1 with the account). Carries `division_id` (required), `position_id` (optional), employment/dismissal dates, avatar, biography. Many feature aggregates point at `employees.id`: course authorship, course enrollments, test attempts, onboarding (both as assigner and assignee), and chat messages.
- **`client_companies`** — external customer organizations.
- **`clients`** — external (customer-side) user profile. Like `employees`, PK is also the FK to `users.id`; FK → `client_companies.id` for the employer.

### Files (`files`)

- **`files`** — single store for uploaded blobs (just `url`). Other tables reference it via `*_id` columns (course covers, employee/client/company avatars, onboarding template & step covers). All FKs use `ON DELETE SET NULL` so deleting a file never cascades into business data.

### Education (`courses`, `modules`, `steps`, `lessons`, `tests`, `course_questions`, `course_answers`, `test_questions`, `test_attempts`, `test_attempt_answers`, `course_enrollments`, `step_progress`)

- **`courses`** — top-level learnable unit. `author_id` → `employees.id`; optional `cover_id` → `files.id` (SET NULL). Owns `modules` (cascade), `course_questions` (cascade), and `course_enrollments` (cascade). Also referenced by `onboarding_template_steps` / `onboarding_steps` when a step is course-based.
- **`modules`** — ordered sub-sections of a course. Unique `(course_id, position)` enforces a single ordering.
- **`steps`** — ordered units inside a module. `type` (`step_type` enum: `LESSON` or `TEST`) plus an optional `lesson_id` / `test_id` (both SET NULL when the referenced lesson/test is removed). Unique `(module_id, position)`.
- **`lessons`** — reusable lesson content referenced by `steps.lesson_id`.
- **`tests`** — reusable test definitions; referenced by `steps.test_id` and by `test_attempts`.
- **`course_questions`** — pool of questions belonging to a course, optionally scoped to a specific module. Source of truth for both display in modules and for test composition.
- **`course_answers`** — answer options for a `course_question`, with `is_correct` flag.
- **`test_questions`** — which questions a particular test pulls in. Unique `(test_id, question_id)` prevents duplicates.
- **`test_attempts`** — one row per "an employee opened this test". Closed when `ended_at` is set. Indexed on `(employee_id, test_id)` for "have they passed yet" queries.
- **`test_attempt_answers`** — per-question response within an attempt. Holds the chosen `answer_id` plus the literal `option` text snapshot.
- **`course_enrollments`** — an employee enrolled in a course. Unique `(course_id, employee_id)` ensures a single live enrollment row; carries `status` (`enrollment_status` enum: `IN_PROGRESS` / `COMPLETED` / `CANCELLED`), `started_at`, `completed_at`. Cascades from course or employee deletion.
- **`step_progress`** — per-step completion record under an enrollment. Unique `(step_id, enrollment_id)` so each step has at most one progress row per enrollment.

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
