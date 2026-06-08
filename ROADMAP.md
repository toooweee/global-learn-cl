# ROADMAP

Это план «как достроить приложение». Написан в первую очередь для будущих сессий Claude, поэтому
пишу плотно, со ссылками на конкретные файлы, и фиксирую решения, которые ещё надо принять.

Состояние на 2026-06-07 (обновлено после Phase 3):
- БД полностью описана (см. `prisma/schema.prisma`). ⚠ Секция «Database schema» в `CLAUDE.md` устарела (там ещё описаны `clients` / `client_companies` / `user_roles` join + плоский `Position` без иерархии) — поправить при первой удобной правке. Актуальные ключевые отличия от того, что в `CLAUDE.md`:
  - **`Client` / `ClientCompany` удалены** — система чисто B2E (employees only). `Course.author`, enrollment, test attempts, onboarding, chat — всё привязано только к `Employee`.
  - **`Role` теперь many-to-one с `User`** (`User.roleId` FK, `onDelete: Restrict`). Никакой join-таблицы `user_roles` нет. Роли — `Admin`, `Employee` (сидятся через `pnpm prisma db seed`).
  - **`Position` иерархична**: self-reference `parent_id` / `subordinates[]` через relation `PositionHierarchy` (`onDelete: SetNull`). Цепочка вверх описывает «руководитель этого сотрудника». Используется для read-side онбординга (Phase 5.2) и любых будущих «мои подчинённые»-вьюх.
  - **Модель `Token`**: `id`, `hashedToken`, `userAgent`, `expiresAt`, `userId` (FK Cascade), `@@unique([userId, userAgent])`. Полностью реализована в `TokenModule`.
- Wired-up модули: `EnvModule`, `PrismaModule`, `RequestContextModule`, `UserModule`, `OnboardingModule`, **`AuthModule`** (Phase 1), **`TokenModule`** (Phase 1). `CqrsModule.forRoot()` зарегистрирован глобально в `AppModule` — новые feature-модули его НЕ импортируют.
- **Phase 0 и Phase 1 полностью закрыты.** Auth-слой активен: `JwtAuthGuard` + `RolesGuard` зарегистрированы глобально как `APP_GUARD`. Все эндпоинты защищены по умолчанию; открытые помечаются `@Public()`.
- Скелеты в `src/modules/{employee,education/*}` — всё ещё пустые. `identity/auth/` и `identity/token/` — заполнены.
- **`AppRequestContext`** несёт `requestId` + `prismaTransaction` + `userId` + `userRole`. `Command.metadata.userId` автоматически берётся из `RequestContextService.getUserId()`.
- **`PasswordService`** в `src/libs/crypto/` (argon2 wrapper). **`CryptoModule`** экспортирует его — импортировать в модули, где нужен хеш пароля.
- **`TokenService`** (`src/modules/identity/token/token.service.ts`): `issueTokenPair(userId, role, userAgent)` → `{ accessToken, refreshToken }`, `verifyAndRotateRefreshToken(...)`. Access = JWT (secret `JWT_ACCESS_SECRET`, TTL `JWT_ACCESS_TTL`). Refresh = 32-byte hex opaque, argon2-хеш в БД, TTL `JWT_REFRESH_TTL`.
- **`Employee.id === User.id`** (shared PK) — `userId` из JWT-токена = `employeeId` везде. `@CurrentUser()` возвращает `{ userId, role }` из `AppRequestContext`.
- `UserEntity` / `UserMapper` / `UserPrismaRepository` обновлены: добавлен `roleId`, репозиторий использует `this.db` (transaction-aware). `DeleteUserCommandHandler` реализован.
- `assignedById` / `senderId` убраны из тела запросов онбординга — берутся из `@CurrentUser()`.
- Read-side паттерн (важно для копипасты): query handlers инжектят `PrismaService` напрямую. Для команд и транзакций — репозиторий.
- Swagger включён на `/api/docs`. Добавить `@ApiBearerAuth()` на защищённые контроллеры — пока не сделано, но `persistAuthorization: true` позволяет вставить токен вручную.
- Redis объявлен в `.env` / `EnvSchema`, но не используется. MailHog поднят, но мейлера нет.

> Перед каждой большой фазой проверять: `pnpm lint && pnpm build && pnpm test`. Прогон `pnpm prisma generate` нужен после любых изменений `schema.prisma`. Node берём из `.nvmrc` (24.15.0) — Node 18 ломает Prisma 7 CLI (см. ошибку `ERR_REQUIRE_ESM` в zeptomatch).

---

## Phase 0 — Кросс-режущая инфраструктура (быстрые, разблокирующие задачи)

Эти штуки тривиальны, но без них последующие фазы будут писаться криво.

- [x] **Global exception filter** — сделано иначе, чем планировал, но цель достигнута. Реализация: `AllExceptionsFilter` (`src/infra/exception-filters/all-exceptions.filter.ts`), зарегистрирован как `APP_FILTER` в `AppModule`. Базовые типы — `DomainException` (`libs/ddd/`) и `ApplicationException` (`libs/application/exceptions/`), оба несут `statusCode` + `code`. Имена `ConflictError`/`NotFoundError`/`ForbiddenError` НЕ заведены — вместо иерархии классов используем разные `code` + `statusCode` при бросании. Ответ: `{ statusCode, code, message, timestamp, path, correlationId }`.
- [x] **`throw new Error(...)` в `OnboardingEntity` / `OnboardingChatEntity` / `OnboardingTemplateEntity` заменены на `DomainException`** с осмысленными `code`-ами (`ONBOARDING_INVALID_DATE_RANGE`, `ONBOARDING_STEP_OUT_OF_ORDER`, `ONBOARDING_CHAT_SENDER_FORBIDDEN`, …). Handlers онбординга тоже переехали с `NotFoundException`/`ConflictException` на `ApplicationException`.
- [x] **Swagger** — поднят через `setupSwagger(app)` (`src/infra/configs/swagger.config.ts`), смонтирован на **`/api/docs`** (не `/docs`) с `persistAuthorization: true`. Используем чистый `@nestjs/swagger` — `nestjs-zod`-адаптер НЕ нужен, потому что DTO переехали на class-validator.
- [x] **Логгер с correlationId** — реализован `AppLogger` (`src/infra/logger/app.logger.ts`) extends `ConsoleLogger`: автоматически префиксует строковые сообщения `[<requestId>]`, читая его из `RequestContextService.getRequestId()` (если контекста нет — без префикса). Подключён через `app.useLogger(new AppLogger())` в `main.ts` с `bufferLogs: true`. Ручные `[${requestId}]`-вставки удалены из `ContextInterceptor`, `PrismaService`, `AllExceptionsFilter` — теперь префикс ставит сам логгер. Pino пока НЕ заводим.
- [x] **Расширить `EnvSchema`** — добавлено: `JWT_ACCESS_SECRET` (min 16), `JWT_REFRESH_SECRET` (min 16), `JWT_ACCESS_TTL` (default `'15m'`), `JWT_REFRESH_TTL` (default `'30d'`), `SMTP_HOST` (default `'localhost'`), `SMTP_PORT` (default `1025`). `FILES_*` пока пропустил — Phase 3 ещё не решена (MinIO vs локальный диск). `.env.example` обновлён.
- [x] **`AppRequestContext.userId`** — `AppRequestContext` расширен полями `userId?: string` и `userRole?: string`. `RequestContextService` получил `setUserId`/`getUserId`/`setUserRole`/`getUserRole`. `JwtAuthGuard` заполняет оба поля после верификации токена. `command.base.ts` автоматически подхватывает `userId` из контекста (`props?.metadata?.userId ?? RequestContextService.getUserId()`).

---

## Phase 1 — Auth & Identity (блокирует ВСЁ остальное)

Сейчас контроллеры онбординга принимают `assignedById` / `senderId` в теле запроса — это временная заглушка. После auth-слоя их надо переключить на текущего пользователя.

### 1.1 Хеширование паролей

- [x] **`argon2` добавлен** и используется inline в `CreateUserCommandHandler` (`argon.hash(password)`).
- [x] Выделен `src/libs/crypto/password.service.ts` — `hash(plain)` / `verify(hash, plain)` — `CreateUserCommandHandler` переключён на него. `CryptoModule` (`src/libs/crypto/crypto.module.ts`) экспортирует `PasswordService`. Импортируется в `UserModule` и `AuthModule`.

### 1.2 Token module (`src/modules/identity/token/`)

Папка уже есть, пустая. Цель — простая refresh-token ротация (внутренняя корпоративная система, цепочка с `revokedAt`/`replacedById`/IP-трекингом избыточна).

- [x] Модель `Token` в `schema.prisma`: `id`, `hashedToken`, `userAgent`, `expiresAt`, `userId` (FK Cascade), `@@unique([userId, userAgent])`. Один активный refresh-токен на пользователя на устройство (ключ устройства = `userAgent`).
- [x] `TokenEntity` + `TokenMapper` + `TokenRepositoryPort` / `TokenPrismaRepository` реализованы. `TokenMapper` имплементирует только `ToDomain` + `ToPersistence` (без `toResponse` — токены наружу как DTO не отдаём).
- [x] `TokenService` (`src/modules/identity/token/token.service.ts`) — `issueTokenPair` / `verifyAccessToken` / `verifyAndRotateRefreshToken`. Access = JWT подписанный `JWT_ACCESS_SECRET` с TTL `JWT_ACCESS_TTL`. Refresh = 32-byte hex opaque, argon2-хеш в `tokens`, TTL `JWT_REFRESH_TTL` парсится в `expiresAt`. `@nestjs/jwt` добавлен в зависимости.
- [x] Стратегия ротации: `upsert` по `(userId, userAgent)` при login/refresh, `deleteMany` при logout/change-password. `TokenModule` экспортирует `TokenService`, `JwtModule`, `TOKEN_REPOSITORY`.
- [x] **Решение принято и реализовано**: в JWT access кладём `sub: userId` + `role: role.name`. `RolesGuard` сравнивает `.includes(role)` без обращения к БД.

### 1.3 Auth module (`src/modules/identity/auth/`)

Скелеты есть — заполнить:

- [x] `register.command(-handler).ts` — создаёт `User` (с `roleId`) + `Employee` атомарно через `prismaService.client.$transaction()`. Защищён `@Roles('Admin')`. `POST /auth/register`. ⚠ Tech-debt: создание Employee bypasses `EmployeeEntity` (его ещё нет) — рефакторинг в Phase 2.2.
- [x] `complete-registration.*` — `@Public()`, принимает `email + newPassword`, обновляет `hashedPassword`. Invite-token механизм (Phase 6) не реализован.
- [x] `login.*` — сверяет пароль через `PasswordService.verify`, выпускает пару через `TokenService.issueTokenPair`. `POST /auth/login`.
- [x] `refresh-tokens` — `refresh-token.command-handler.ts` создан. Загружает `role` через `include: { role: true }`, делегирует `TokenService.verifyAndRotateRefreshToken`. `POST /auth/refresh`.
- [x] `logout.*` — `TokenService.deleteByUserAndAgent`. `POST /auth/logout`.
- [x] `change-password.*` — проверяет старый пароль, обновляет хеш, удаляет все токены пользователя. `POST /auth/change-password`.

### 1.4 Guards / Decorators

- [x] `JwtAuthGuard` (`src/libs/auth/guards/jwt-auth.guard.ts`) — парсит `Authorization: Bearer ...`, верифицирует JWT, кладёт `userId` + `role` в `AppRequestContext`. Зарегистрирован как `APP_GUARD` глобально в `AppModule`.
- [x] `@Public()` (`src/libs/auth/decorators/public.decorator.ts`) — метаданные `IS_PUBLIC_KEY`, `JwtAuthGuard` пропускает такие эндпоинты.
- [x] `RolesGuard` (`src/libs/auth/guards/roles.guard.ts`) + `@Roles(...roles)` (`src/libs/auth/decorators/roles.decorator.ts`) — глобальный `APP_GUARD`, сравнивает `role` из контекста через `.includes()`.
- [x] `@CurrentUser()` (`src/libs/auth/decorators/current-user.decorator.ts`) — param-декоратор, возвращает `{ userId: string, role: string }` из `AppRequestContext`.

### 1.5 Seed ролей

- [x] `prisma/seed.ts` создан — `upsert` ролей `Admin` и `Employee`. Зарегистрирован в `package.json` `"prisma": { "seed": "ts-node -r tsconfig-paths/register prisma/seed.ts" }`. Запуск: `pnpm prisma db seed`. (`prisma.config.ts` не поддерживает `seed` в Prisma 7 — используется `package.json`.)

### 1.6 Пост-условие

- [x] В контроллерах онбординга убраны `assignedById` / `senderId` из body — берутся из `@CurrentUser()`. `AssignOnboardingRequestDto` больше не содержит `assignedById`; `SendOnboardingChatMessageRequestDto` — `senderId`.

---

## Phase 2 — Organization & People (depends on Phase 1) ✅

### 2.1 Department / Division / Position

- [x] `src/modules/organization/department/` — entity, репозиторий, CRUD use cases (`create`, `update`, `delete`, `find`, `find-all`), контроллер. `Admin`-only на write.
- [x] `src/modules/organization/division/` — то же, FK на `department`. `FindDivisionsQuery` поддерживает `?departmentId` фильтр.
- [x] `src/modules/organization/position/` — self-reference иерархия (`parentId?`). Use cases: `create`, `update`, `delete`, `find`, `find-all`. Read-side: `GetPositionTreeQuery` (3-уровневый nested include → `PositionTreeDto[]`). `GET /positions/tree` зарегистрирован ДО `GET /positions/:id`.
- [x] `src/modules/organization/organization.module.ts` — единый модуль, экспортирует `DIVISION_REPOSITORY` и `POSITION_REPOSITORY`. Подключён в `AppModule`.

### 2.2 Employee (`src/modules/employee/`)

- [x] `domain/employee.entity.ts` — `Props`: `fullname`, `biography?`, `employmentDate`, `dismissalDate?`, `divisionId`, `positionId?`, `avatarId?`. `create(props)` принимает внешний `id` (shared PK с `User`). Методы: `dismiss()` (выставляет `dismissalDate`), `promote(positionId)`.
- [x] Use cases: `create-employee` (создаёт `User`+`Employee` атомарно через `repo.transaction`), `update-employee`, `delete-employee` (soft delete — `dismiss()`), `promote-employee`.
- [x] Read-side: `find-employee`, `find-employees` (paginated), `find-my-subordinates` (employees, чей `position.parentId` = текущий `positionId`).
- [x] `EmployeeModule` — импортирует `PrismaModule`, `CryptoModule`, `UserModule`; экспортирует `EMPLOYEE_REPOSITORY`. Подключён в `AppModule`.

### 2.3 Register refactor

- [x] `RegisterCommandHandler` рефакторирован — делегирует `CreateEmployeeCommand` через `CommandBus` (не bypasses `EmployeeEntity`).

### 2.3 User module (`src/modules/identity/user/`)

- [x] `user.repository.port.ts` — `UserRepositoryPort extends RepositoryPort<UserEntity>` + `findByEmail`.
- [x] `user-prisma.repository.ts` — реализован: `save`, `findById`, `findByEmail`, `delete`. ⚠ Технический долг: внутри используется `this.prismaService.client.user.*` — должен быть `this.db.user.*`, чтобы методы видели активную транзакцию из `RequestContextService`. Поправить при первой правке этого файла.
- [x] `UserService` — упразднён, заменён на CQRS handlers + репозиторий.
- [x] **`DeleteUserCommand`** — handler реализован: загружает entity, вызывает `userRepository.delete(entity)`.
- [ ] Прочее API через CQRS: `UpdateUserCommand` (email/password — отдельные команды? одна команда с private fields? — решить при добавлении профиля). `FindUserByEmailQuery` понадобится для auth-флоу (вернёт `User` с `role` через `include: { role: true }` — read-side direct-Prisma путь).

---

## Phase 3 — Files (depends on Phase 1) ✅

Реализовано на 2026-06-07. Решения и факты:

- **Хранилище**: MinIO (S3-совместимое) — уже было поднято в `docker-compose.yaml` + `docker-compose.local.yaml` (порты 9000/9090). Env-переменные `MINIO_ENDPOINT`, `MINIO_ROOT_USER`, `MINIO_ROOT_PASSWORD`, `MINIO_BUCKET_NAME`, `MINIO_REGION` добавлены в `EnvSchema` и `.env.example`.
- **`src/infra/file/`** (инфра-слой, вынесен пользователем до этой сессии):
  - `FileModule` — `@Module` с `S3Client` + привязкой `FILE_STORAGE → S3StorageAdapter`. Экспортирует `FILE_STORAGE`.
  - `S3StorageAdapter` — `upload()` возвращает **публичный URL** (`${endpoint}/${bucket}/${key}`), `delete(publicUrl)` извлекает ключ и удаляет объект, `getSignedUrl(publicUrl)` генерирует presigned GET на 1 час через `@aws-sdk/s3-request-presigner`. При старте (`onModuleInit`) проверяет/создаёт бакет.
  - `aws-sdk.config.ts` — фабрика `S3Client` с `forcePathStyle: true` (нужно для MinIO).
- **`src/modules/files/`** (feature-модуль, DDD):
  - `FileEntity` — `create(props)` / `recreate({id, props})`. Props: `{ url: string }`.
  - `FileMapper` — реализует полный `Mapper<FileEntity, FileRecord, FileResponseDto>`. `FileRecord` = `import type { File as FileRecord } from '@generated/client'`.
  - `FilePrismaRepository` — `save`, `findById`, `delete`. Использует `this.db` (transaction-aware).
  - `UploadFileCommand` / `UploadFileCommandHandler` — принимает `{ buffer, filename, mimeType }`, загружает в S3, создаёт `FileEntity`, сохраняет в `files`. Возвращает `FileResponseDto` с presigned URL.
  - `DeleteFileCommand` / `DeleteFileCommandHandler` — находит файл, удаляет из S3 и из `files`.
  - `FileController` — `POST /files` (multer `FileInterceptor`, memory storage, лимит 5 MB, MIME-whitelist: `image/jpeg`, `image/png`, `image/webp`, `image/gif`), `GET /files/:id` (возвращает presigned URL), `DELETE /files/:id`. Swagger-аннотирован.
  - `FilesModule` — импортирует `FileInfraModule` + `PrismaModule`, экспортирует `FILE_REPOSITORY`.
- **Декаплинг**: владельцы (`course`, `employee`, `onboarding_template`) хранят только `file_id` FK. Доступ к URL всегда через `GET /files/:id`.
- **Лимиты**: размер файла 5 MB (multer `limits.fileSize`), MIME-whitelist проверяется в контроллере (бросает `ApplicationException` с кодом `INVALID_FILE_TYPE`).
- **Tech-debt Phase 7**: cleanup осиротевших файлов при удалении владельца (сейчас FK `ON DELETE SET NULL` — файл остаётся в `files` и в MinIO).

---

## Phase 4 — Education (depends on Phase 1 + Phase 3 для обложек)

### 4.1 Курс как агрегат ✅

- [x] `CourseEntity` — `create` / `updateMetadata` / `addModule` / `removeModule` / `addStep` / `removeStep` с авто-позиционированием.
- [x] `CourseMapper` (ToDomain) + `CourseRecord` = `Prisma.CourseGetPayload<{ include: typeof courseInclude }>`.
- [x] `CoursePrismaRepository` — `save` (upsert + replaceTree modules+steps), `findById`, `findMany`, `delete`.
- [x] Commands: `create-course`, `update-course`, `delete-course`, `add-module`, `remove-module`, `add-step`, `remove-step`.
- [x] Queries: `find-course` (by ID, direct Prisma → `CourseResponseDto`), `find-courses` (paginated → `CourseSummaryResponseDto`).
- [x] `CourseController` — `POST /courses`, `GET /courses`, `GET /courses/:id`, `PATCH /courses/:id`, `DELETE /courses/:id`, `POST /courses/:id/modules`, `DELETE /courses/:id/modules/:moduleId`, `POST /courses/:id/modules/:moduleId/steps`, `DELETE /courses/:id/modules/:moduleId/steps/:stepId`.
- [x] **Course scope** (2026-06-08): `CourseScope` enum (`ALL | DEPARTMENT | DIVISION`) добавлен в схему + `Course.scope`, `Course.departmentId`, `Course.divisionId`. Доменные инварианты в `CourseEntity.create/updateMetadata`. `courseInclude` расширен department/division. `GET /courses` поддерживает фильтры `?scope`, `?departmentId`, `?divisionId`. Все create/update команды и DTO обновлены.
- [x] **Обогащение курсовых запросов** (2026-06-08): `GET /courses/:id` — возвращает `scopeInfo {scope, departmentId, departmentName, divisionId, divisionName}`, полный список модулей со шагами, прогресс текущего пользователя (`enrollment {status, completedSteps, totalSteps, completionRate}`), `isCompleted` на каждом шаге, `completedSteps/totalSteps` на каждом модуле. `GET /courses` — возвращает `moduleCount`, `scopeInfo`, прогресс текущего пользователя (1 доп. запрос на всю страницу через `findMany`).

### 4.2 Course-application (заявки на курсы) ✅

Сотрудники подают заявки на курсы; менеджеры/admin утверждают или отклоняют. При утверждении автоматически создаётся `CourseEnrollment`.

- [x] `CourseApplicationEntity` — `create` / `approve` / `reject` с проверкой статуса `PENDING`.
- [x] `CourseApplicationMapper` (ToDomain).
- [x] `CourseApplicationPrismaRepository` — `save`, `findById`, `findByCourseAndEmployee`, `findMany`.
- [x] Commands: `apply-for-course` (employeeId из контекста), `approve-course-application` (→ создаёт `CourseEnrollment`), `reject-course-application`.
- [x] Queries: `find-applications-for-course` (admin, by courseId), `find-my-applications` (employee, by employeeId из контекста).
- [x] `CourseApplicationController` — `POST /courses/:id/applications`, `GET /courses/:id/applications`, `PATCH /courses/:id/applications/:appId/approve`, `PATCH /courses/:id/applications/:appId/reject`, `GET /me/applications`.

### 4.3 Enrollment + StepProgress ✅

- [x] `EnrollmentEntity` — `create` / `startStep` / `completeStep` / `markCompleted` / `cancel`. `completeStep` авто-проставляет `COMPLETED` на enrollment, когда кол-во выполненных шагов == кол-ву шагов курса.
- [x] `EnrollmentMapper` (ToDomain) + `enrollmentInclude = { progress: true }`.
- [x] `EnrollmentPrismaRepository` — `save` (upsert enrollment + upsert каждого StepProgress), `findById`, `findByCourseAndEmployee`, `findMany`.
- [x] Commands: `create-enrollment` (admin/manager задаёт employeeId), `start-step`, `complete-step` (+ PrismaService для подсчёта шагов курса), `cancel-enrollment`.
- [x] Queries: `find-enrollment` (with progress), `find-my-enrollments` (paginated, employeeId из контекста).
- [x] `EnrollmentController` — `POST /courses/:id/enroll`, `GET /me/enrollments`, `GET /enrollments/:id`, `DELETE /enrollments/:id`, `POST /enrollments/:id/steps/:stepId/start`, `POST /enrollments/:id/steps/:stepId/complete`.

### 4.4 Test attempts ✅

Дизайн-решения (зафиксировано с пользователем): попыток неограниченно, проходной балл 80%, показываем только N/M (без раскрытия правильных/неправильных ответов).

- [x] `TestAttemptEntity` — `create` / `answerQuestion` (upsert по questionId) / `finish`. Бросает `DomainException` при попытке ответить/завершить уже закрытый attempt.
- [x] `TestAttemptMapper` (ToDomain) + `testAttemptInclude = { answers: true }`.
- [x] `TestAttemptPrismaRepository` — `save` (upsert attempt + upsert answers), `findById`.
- [x] Commands: `start-test-attempt` (employeeId из контекста), `answer-question` (upsert ответа), `finish-test-attempt` (→ `TestAttemptResultDto { correct, total, passed }`; `passed = correct/total >= 0.8`).
- [x] Query: `find-test-attempt` → `TestAttemptResponseDto` (answeredCount, статус завершения).
- [x] `TestAttemptController` — `POST /tests/:testId/attempts`, `GET /attempts/:id`, `POST /attempts/:id/answers`, `POST /attempts/:id/finish`.

### 4.5 Lessons / Tests CRUD ✅

- [x] **Lesson**: `LessonEntity` (name only), `LessonMapper`, `LessonPrismaRepository`, commands: `create-lesson`, `update-lesson`, `delete-lesson`. `LessonController` — `POST /lessons`, `PATCH /lessons/:id`, `DELETE /lessons/:id`. (Роли: admin/manager.)
- [x] **TestDefinition** (`Test` в схеме): `TestDefinitionEntity` (name only), `TestDefinitionMapper`, `TestDefinitionPrismaRepository` (+ `addQuestion` / `removeQuestion` через `TestQuestion`). Commands: `create-test-definition`, `update-test-definition`, `delete-test-definition`, `add-question-to-test`, `remove-question-from-test`. Query: `find-test-definition` (with questions + answers).
- [x] **CourseQuestion** (банк вопросов курса): `CourseQuestionEntity` (question + `CourseAnswer[]`), `CourseQuestionPrismaRepository` (save replaces answers). Commands: `create-course-question` (question + answers[]), `delete-course-question`. Query: `find-course-questions` (by courseId).
- [x] `TestDefinitionController` — `POST/GET/PATCH/DELETE /test-definitions/:id`, `POST/DELETE /test-definitions/:id/questions/:questionId`, `POST /courses/:id/questions`, `GET /courses/:id/questions`, `DELETE /questions/:id`.

---

## Phase 5 — Доделать Onboarding

Что уже есть (write-сторона): создание шаблона, назначение, complete-step, отправка сообщения в чат. Что недоделано:

### 5.1 Write-сторона — оставшиеся команды ✅

- [x] `UpdateOnboardingTemplate` — `OnboardingTemplateEntity.update()` + repo `save()` делает `deleteMany steps` → `createMany` в одной `upsert`. `PUT /onboarding/templates/:id`.
- [x] `CancelOnboarding` — вызывает `entity.cancel()` + save. `POST /onboardings/:id/cancel` (204).
- [x] `MarkChatMessagesRead` — updateMany по `chatId`, `senderId != readerId`, `readAt IS NULL`. `POST /onboardings/:id/chat/messages/read` (204).

### 5.2 Read-сторона — query handlers + GET endpoints ✅

**Onboarding template:**
- [x] `GetOnboardingTemplateQuery` → `GET /onboarding/templates/:id` → `OnboardingTemplateResponseDto` (шаги + feedback-опции).
- [x] `ListOnboardingTemplatesQuery` (`PaginatedQuery`) → `GET /onboarding/templates?limit&page&positionId&divisionId` → `Paginated<OnboardingTemplateSummaryResponseDto>`.

**Onboarding assignment:**
- [x] `GetOnboardingQuery` → `GET /onboardings/:id` → `OnboardingResponseDto` (шаги + статусы + selections).
- [x] `ListMyOnboardingsQuery` → `GET /onboardings/mine` → `OnboardingSummaryResponseDto[]`.
- [x] `ListAssignedByMeQuery` → `GET /onboardings/assigned-by-me` → `OnboardingSummaryResponseDto[]`.
- [ ] `ListMySubordinatesOnboardingsQuery` — онбординги подчинённых (рекурсивный поиск по иерархии должностей). Tech-debt.

**Onboarding chat:**
- [x] `ListChatMessagesQuery` (cursor-based: `?before=<msgId>&limit=`) → `GET /onboardings/:id/chat/messages` → `ChatMessagesPageResponseDto { messages, nextCursor }`.

**Response DTOs:**
- [x] `OnboardingTemplateResponseDto`, `OnboardingTemplateSummaryResponseDto`.
- [x] `OnboardingResponseDto`, `OnboardingSummaryResponseDto`, `OnboardingStepResponseDto`.
- [x] `OnboardingChatMessageResponseDto`, `ChatMessagesPageResponseDto`.

### 5.3 Hooks из других модулей

- [ ] **Авто-назначение при создании Employee**: `CreateEmployeeHandler` проверяет шаблон для `(positionId, divisionId)` и назначает онбординг. Требует `defaultDurationDays` в `OnboardingTemplate` (мини-миграция).
- [x] **Notification + mail on assignment**: реализовано в фазе 6 — `AssignOnboardingHandler` → `NotificationService.notify()` + `MailService.sendOnboardingAssigned()`.

---

## Phase 6 — Realtime, Notifications, Mail ✅

### 6.1 Notifications ✅

- [x] `src/modules/notifications/` — `NotificationService` (create, markRead, markAllRead, findByUser via PrismaService напрямую). Контроллер: `GET /me/notifications`, `POST /me/notifications/:id/read`, `POST /me/notifications/read-all`. Синхронная доставка — tech-debt: outbox/BullMQ.
- [x] `NotificationModule` экспортирует `NotificationService`; импортируется в `OnboardingModule` и `EducationModule`.

### 6.2 WebSocket gateway (чат + push) ✅

- [x] `@nestjs/websockets` + `@nestjs/platform-socket.io` + `socket.io` добавлены в deps.
- [x] `src/infra/gateway/gateway.module.ts` — `@Global()` `GatewayModule` экспортирует оба гейтвея.
- [x] `NotificationsGateway` (namespace `/notifications`) — JWT auth на connect, комната `user:{userId}`, метод `sendToUser(userId, event, data)`.
- [x] `OnboardingChatGateway` (namespace `/chat`) — JWT auth на connect, клиент подписывается через событие `subscribe({ chatId })`, метод `sendToChat(chatId, message)`. Вызывается из `SendOnboardingChatMessageHandler` после сохранения.

### 6.3 Mail (MailHog уже поднят на 1025/8025) ✅

- [x] `nodemailer` + `@types/nodemailer` добавлены в deps.
- [x] `src/modules/mail/mail.service.ts` — `MailService` с `onModuleInit` транспортом; шаблоны: `sendOnboardingAssigned`, `sendCourseEnrollmentApproved`, `sendEmployeeInvite`.
- [x] `SMTP_FROM` добавлен в `EnvSchema` и `.env.example`.
- [x] Триггеры: назначение онбординга (`AssignOnboardingHandler`) → уведомление + письмо; одобрение заявки на курс (`ApproveCourseApplicationCommandHandler`) → уведомление + письмо.

---

## Phase 7 — Quality & Ops

### 7.1 Тесты

Сейчас два спека (`app.controller.spec.ts`, `user.service.spec.ts`), оба ничего не проверяют.

- [ ] **Unit-тесты на domain entity** — чистая логика, без моков БД. Приоритет: `OnboardingEntity.completeCurrentStep` (последовательность, фидбек, статус), `OnboardingTemplateEntity.create` (валидация offset-ов), будущий `TestAttemptEntity`.
- [ ] **Integration-тесты на handlers** — поднимать Prisma на тестовой БД (см. `docker-compose`-overrride или `pg-mem`). Использовать `Testing.createTestingModule` + реальный `PrismaService`, реальные репозитории.
- [ ] **e2e** — расширить `test/app.e2e-spec.ts`, добавить happy-path сценарии: register → assign onboarding → complete steps → chat.

### 7.2 Сиды и фикстуры

- [ ] `prisma/seed.ts` — роли, демо-департамент, демо-должность, демо-сотрудник (admin), демо-шаблон онбординга, демо-курс. Команда `pnpm prisma:seed`.
- [ ] Скрипт `make demo` — поднять docker, мигрировать, прогнать seed.

### 7.3 CI

- [ ] `.github/workflows/ci.yaml` — добавить шаг `pnpm prisma generate` перед `pnpm build` (или закоммитить ` generated/` — обычно не делают). Сейчас CI может валиться на чистом клоне.
- [ ] Добавить шаг `pnpm prisma migrate deploy` на сервис-БД (Postgres container в CI) перед тестами.

### 7.4 Observability

- [ ] Health-check эндпоинт `/health` (БД ping, Redis ping).
- [ ] Метрики (Prometheus `/metrics`) — `@willsoto/nestjs-prometheus`. Опционально.

---

## Открытые вопросы (требуют решения от пользователя)

Не браться, пока не спросим:

1. **`Course` — агрегат целиком или отдельные модули с собственными агрегатами?** Я склоняюсь к «агрегат целиком», но это влияет на 5+ файлов в фазе 4.
2. **`course_applications` — что это за сущность теперь, без клиентов?** Это «заявка сотрудника на прохождения курса на курс с апрувом руководителя».
3. **Сколько попыток теста разрешено, есть ли проходной балл?** Влияет на `TestAttempt` use cases.
4. **Удаление сотрудника = soft решили, с указанием даты увольнения.
5. **Файлы — MinIO/S3 или локальный диск?** Сильно влияет на сложность фазы 3 - Уже сделали Minio.
6. **Outbox/события или синхронные нотификации?** Tech-долг vs сложность с самого начала.
7. **Авто-назначение онбординга при создании Employee — желательно?** Если да — нужно поле `defaultDurationDays` в `OnboardingTemplate`.
8. **`Position.parent` иерархия — глубина выборки подчинённых?** Когда руководитель смотрит «мои подчинённые» (Phase 2.2) и «онбординги моих подчинённых» (Phase 5.2): возвращаем только прямых (1 уровень вниз) или всю ветку рекурсивно через `WITH RECURSIVE`? Решение влияет на сложность read-side и UX. Я думаю надо рекурсивно делать.
9. **Можно ли менять `User.roleId` после создания?** Если да — нужен `ChangeUserRoleCommand` (роль уходит в JWT, значит после смены роли нужно инвалидировать токены пользователя — `deleteMany tokens by userId`).
10. **`Position.parentId` при удалении родителя — `SetNull` подходит?** Сейчас в схеме именно так: подчинённые «отвязываются». Альтернатива — переподвесить их на parent удаляемого. Для корпсистемы скорее всего `SetNull` норм (HR потом руками настроит), подтвердить. Норм

---

## Приоритеты (если выбирать одно за раз)

1. Phase 0 (filter + swagger) — 1 день.
2. Phase 1 — 2-3 дня. Без этого нельзя двигать ничего связанного с пользователями.
3. Phase 2.2 (Employee), 5 (доделать онбординг) — параллельно после Phase 1.
4. Phase 3 (Files) — когда понадобится для аватарок/обложек.
5. Phase 4 (Education) — самая объёмная, начинать после Phase 2.
6. Phase 6 (Realtime/Mail) — когда фронт начнёт просить.
7. Phase 7 — параллельно всему, минимум — тесты на domain после каждой фазы.

## Правки

Выполни задачу строго по следующим шагам. Соблюдай архитектурный стиль приложения, с которым мы идем. 

### ШАГ 1. Изменения в файле prisma.schema

1.1 Модуль обучения и контента:
- В модель `Lesson` добавь поле контента `content String @db.Text @default("")`.
- В модель `Lesson` добавь опциональное поле `videoId String? @db.Uuid @map("video_id")`. Свяжи его с моделью `File` (в модели `File` добавь обратное поле `lessonVideos Lesson[] @relation("LessonVideo")`, поведение `onDelete: SetNull`).
- В модель `Test` добавь поле `passingPercent Int @default(80) @map("passing_percent")`.
- В модель `TestAttempt` добавь поля денормализованных результатов: `score Int?` (набранный процент/балл) и `isPassed Boolean @default(false) @map("is_passed")`.

1.2 Прогресс и Онбординг:
- В модель `CourseEnrollment` добавь опциональное поле `currentStepId String? @db.Uuid @map("current_step_id")` для трекинга последнего открытого шага.
- В модель `CourseEnrollment` добавь историю назначения: `assignedById String? @db.Uuid @map("assigned_by_id")`. Создай связь `assignedBy Employee? @relation("EnrollmentAssignedBy", fields: [assignedById], references: [id], onDelete: SetNull)`. (В модель `Employee` добавь обратное поле `assignedEnrollments CourseEnrollment[] @relation("EnrollmentAssignedBy")`).
- В модель `OnboardingStep` добавь опциональное уникальное поле зачисления для синхронизации прогресса: `enrollmentId String? @db.Uuid @unique @map("enrollment_id")`. Свяжи его с моделью `CourseEnrollment` (в `CourseEnrollment` добавь обратное поле `onboardingStep OnboardingStep?`, поведение `onDelete: SetNull`).
- В модели `OnboardingTemplate` УДАЛИ строку ограничения `@@unique([positionId, divisionId])` — теперь шаблонов на одну должность может быть несколько.

1.3 Организационная структура:
- В модель `Employee` добавь поле `birthDate DateTime? @map("birth_date") @db.Timestamptz`.
- В модели `Department` и `Division` добавь флаги мягкого скрытия: `isActive Boolean @default(true) @map("is_active")`.

После изменения схемы запусти валидацию и генерацию клиента: `pnpm prisma generate`. Миграции на мне.

---

### ШАГ 2. Модификация существующих API и DTO ✅

2.1 Эндпоинты уроков и курсов: ✅
- `POST /lessons` → принимает `{ name, content? }`. `PATCH /lessons/{id}` → `{ name?, content? }`.
- `GET /courses/{id}` → `lessonContent` возвращается внутри `StepResponseDto` (join через `courseInclude`).

2.2 Управление тестами: ✅
- `POST /test-definitions` → принимает `{ name, passingPercent? }` (дефолт 80). `GET /test-definitions/{id}` → `passingPercent` в ответе.
- `POST /attempts/{id}/finish` → использует динамический `test.passingPercent` из БД, сохраняет `score` и `isPassed` на `TestAttempt`.

2.3 Назначение курсов и Статистика: ✅
- `POST /courses/{id}/enroll` → сохраняет `assignedById` из `@CurrentUser()`. Возвращается в `EnrollmentResponseDto`.
- `GET /courses/{id}/enrollments` → пагинированный список зачислений (новый query `FindEnrollmentsForCourseQuery`).
- `GET /courses/{id}/applications` → добавлен query-фильтр `?status=PENDING|APPROVED|REJECTED`.

2.4 Обогащение EmployeeResponseDto: ✅
- `GET /employees` и `GET /employees/{id}` → возвращают `email`, `role: { id, name }`, `department: { id, name }` через include.
- `EmployeeMapper.toResponse` удалён (query handlers строят DTO напрямую с joined данными).

2.5 Оптимизация авторизации: ✅
- `GET /auth/me/profile` — возвращает полный профиль за один запрос: user, role, employee (fullname, bio, dates, avatar), division (name), department (id, name), position (id, name).

---

### ШАГ 3. Реализация новых GET-эндпоинтов для Онбординга ✅

1. `GET /onboarding/templates` — ✅ `ListOnboardingTemplatesQuery` (PaginatedQuery, фильтры `positionId`, `divisionId`).
2. `GET /onboarding/templates/{id}` — ✅ `GetOnboardingTemplateQuery` (шаги + feedbackOptions).
3. `GET /onboardings` — ✅ `ListOnboardingsQuery` — новый unified endpoint с фильтрами `?assignedToId`, `?assignedById`, `?status` + пагинация. Прежние `/mine` и `/assigned-by-me` сохранены.
4. `GET /onboardings/{id}` — ✅ `GetOnboardingQuery` (шаги + feedbackSelections).
5. `GET /onboardings/{onboardingId}/chat/messages` — ✅ `ListChatMessagesQuery` (cursor-based: `?before&limit`).
