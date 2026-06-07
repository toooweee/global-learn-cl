# ROADMAP

Это план «как достроить приложение». Написан в первую очередь для будущих сессий Claude, поэтому
пишу плотно, со ссылками на конкретные файлы, и фиксирую решения, которые ещё надо принять.

Состояние на 2026-06-07 (обновлено после Phase 1):
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
- [ ] **`DeleteUserCommand`** — есть пустой `delete-user.command.ts`, handler не написан. Доделать.
- [ ] Прочее API через CQRS: `UpdateUserCommand` (email/password — отдельные команды? одна команда с private fields? — решить при добавлении профиля). `FindUserByEmailQuery` понадобится для auth-флоу (вернёт `User` с `role` через `include: { role: true }` — read-side direct-Prisma путь).

---

## Phase 3 — Files (depends on Phase 1)

Сейчас в схеме есть `files`, но загрузки никакой.

- [ ] Решить **где хранить**: локальный диск (для dev) vs S3-совместимое (MinIO в docker-compose добавить). Рекомендую MinIO — продакшен-реалистично и поднимается рядом с Postgres.
- [ ] `src/modules/files/` — `UploadFile` use case, контроллер `POST /files` с `multer`, сохранение URL в `files`, выдача presigned-URL для скачивания (если S3).
- [ ] Декаплинг от модулей: владельцы (course, employee, onboarding) хранят только `file_id`. Cleanup-задача на удаление осиротевших файлов — фаза 7.
- [ ] Подумать про лимиты размера и MIME-whitelist (картинки vs документы).

---

## Phase 4 — Education (depends on Phase 1 + Phase 3 для обложек)

Каркас:
- `src/modules/education/course/` — есть `domain/course.entity.ts`, `course.types.ts`, пустые use cases, пустой controller.
- `src/modules/education/module/` — есть `domain/module.entity.ts`, пустые use cases.
- `src/modules/education/course-application/` — всё пустое.
- `src/modules/education/enrollment/` — есть пустые папки.

### 4.1 Курс как агрегат

Решение: **`Course` — агрегат с детьми Modules→Steps→Lessons/Tests**, как `OnboardingTemplate` со steps. Иначе границы транзакций станут нечёткими.

- [ ] `CourseEntity` — заполнить `create` / `addModule` / `removeModule` / `addStep` / `removeStep`. `getProps()` должен возвращать модули и шаги в плоском виде.
- [ ] Repository port + Prisma adapter (по образцу `OnboardingTemplatePrismaRepository`, но дерево глубже — modules → steps → lesson/test). Нагрузка на `save` будет ощутимой, можно завести `replaceTreeForCourse(id, …)`-операцию.
- [ ] Use cases: `create-course`, `update-course` (метаданные), `publish-course` (если будет состояние draft/published — обсудить), `add-module`, `add-step`.

### 4.2 Course-application (заявки клиентов на курсы)

Понадобится разобраться с доменом: это **клиентские заявки на запись** на курс (для b2c-стороны)? Или внутренние утверждения? **Решение нужно от пользователя** — пометить как BLOCKING.

### 4.3 Enrollment + StepProgress

- [ ] `EnrollmentEntity` — статусы из `enrollment_status`. Use cases: `enroll`, `start-step`, `complete-step`, `cancel-enrollment`. `complete-step` должен апдейтить `step_progress` и проставлять `completed_at` на enrollment, когда все шаги done.

### 4.4 Test attempts

- [ ] `TestAttemptEntity` — `start`, `answer-question`, `finish` (подсчёт результата по `course_answers.is_correct`). Решение нужно: **сколько попыток разрешено, есть ли проходной балл, отображать ли неправильные ответы** — спросить пользователя.

### 4.5 Lessons / Tests CRUD

- [ ] Отдельные модули для CRUD контента уроков и тестов (они переиспользуются через `Step`).

---

## Phase 5 — Доделать Onboarding

Что уже есть (write-сторона): создание шаблона, назначение, complete-step, отправка сообщения в чат. Что недоделано:

### 5.1 Write-сторона — оставшиеся команды

- [ ] `UpdateOnboardingTemplate` use case. Сейчас `save()` в `OnboardingTemplatePrismaRepository` умеет апдейтить только метаданные — нет логики diff-а шагов и опций (см. строки 40–60). Подход: при апдейте `replaceSteps` — снести и создать заново внутри транзакции. Шаги шаблона можно безопасно пересоздавать: они НЕ ссылаются на работающие назначения (там материализованные snapshot-копии).
- [ ] `CancelOnboarding` use case — метод в entity уже есть (`OnboardingEntity.cancel()`), дёрнуть из handler.
- [ ] `MarkMessagesRead` use case — проставить `read_at` на сообщениях, пришедших до cursor-а и не от текущего пользователя.

### 5.2 Read-сторона — query handlers + GET endpoints

Паттерн: query handlers инжектят `PrismaService` напрямую (как в `FindUserQueryHandler`) и возвращают сырые Prisma-записи или DTO. Включают данные через те же `*Include` константы из мапперов, чтобы типы совпадали.

**Onboarding template:**
- [ ] `GetOnboardingTemplateByIdQuery` + handler → `GET /onboarding/templates/:id` → `OnboardingTemplateResponseDto` (новый, в `template/presentation/dto/`). Включает шаги и feedback-опции.
- [ ] `ListOnboardingTemplatesQuery` (`PaginatedQuery`) + handler → `GET /onboarding/templates?limit&page` → `PaginatedResponseDto<OnboardingTemplateSummaryResponseDto>` (без шагов, для списка). Фильтры: `?positionId`, `?divisionId`.

**Onboarding assignment:**
- [ ] `GetOnboardingByIdQuery` + handler → `GET /onboardings/:id` → `OnboardingResponseDto` (с шагами + статусами завершения + feedback-опциями). 403 если запрашивает не `assignedBy`/`assignedTo`/admin.
- [ ] `ListMyOnboardingsQuery` (для сотрудника, `assignedToId = currentUser`) + handler → `GET /onboardings/mine`. Возвращает summary без шагов.
- [ ] `ListAssignedByMeQuery` (для руководителя, `assignedById = currentUser`) + handler → `GET /onboardings/assigned-by-me`. Фильтр `?status=IN_PROGRESS|COMPLETED|CANCELLED`.
- [ ] `ListMySubordinatesOnboardingsQuery` — «вижу онбординги моих подчинённых». «Подчинённый» = `Employee` с `position.parent.id` где-то в цепочке моей `positionId` (см. Phase 2.1 — рекурсивный поиск). Фильтр `?status=`. Решить (см. Open Questions): только прямые подчинённые или вся ветка вниз.
- [ ] Репозиторий: метод `findByAssignee` уже есть, добавить `findByAssigner` и `findManyPaginated` под фильтры.

**Onboarding chat:**
- [ ] `ListChatMessagesQuery` (cursor-based pagination: `?before=<msgId>&limit=`) + handler → `GET /onboardings/:onboardingId/chat/messages`. Возвращает `{messages: OnboardingChatMessageResponseDto[], nextCursor: string | null}`. 403 для не-участников чата.

**Response DTOs (новые, в `libs/api/dto/` если переиспользуются, иначе в `presentation/dto/<thing>.response.dto.ts`):**
- [ ] `OnboardingTemplateResponseDto` (полный), `OnboardingTemplateSummaryResponseDto` (для списка).
- [ ] `OnboardingResponseDto` (полный с шагами), `OnboardingSummaryResponseDto`.
- [ ] `OnboardingStepResponseDto`, `OnboardingChatMessageResponseDto`.

Все extend-ить от `BaseResponseDto` (id + createdAt + updatedAt). После реализации обновить мапперы: к существующим `ToDomain` добавить `ToResponse` и `implements Mapper<Entity, DbRecord, ResponseDto>` (полный интерфейс, как в `UserMapper`).

### 5.3 Hooks из других модулей

- [ ] **Авто-назначение при создании Employee и при `promote-employee`**: после фазы 2 — `CreateEmployeeHandler` смотрит, есть ли шаблон для `(positionId, divisionId)`, и если есть — назначает онбординг автоматически. Дату конца брать из шаблона (добавить поле `defaultDurationDays` в `OnboardingTemplate` — мини-миграция).
- [ ] **Notification on assignment**: после фазы 6 — событие `OnboardingAssigned` → push в `notifications` + email через MailHog.

---

## Phase 6 — Realtime, Notifications, Mail

### 6.1 Notifications

- [ ] `src/modules/notifications/` — entity `NotificationEntity`, репозиторий, use cases `CreateNotification`, `MarkRead`, `MarkAllRead`. Контроллер: `GET /notifications`, `POST /notifications/:id/read`.
- [ ] Решение: «отправка» — синхронно из command-handler или через outbox/события? Минимальный вариант — синхронно. Лучше — **outbox-таблица** (`outbox_events`), фоновый воркер на BullMQ читает и публикует. Заведу пока без BullMQ, отметить как tech-debt.

### 6.2 WebSocket gateway (чат + push)

- [ ] `@nestjs/websockets` + `socket.io` — пока нет в deps.
- [ ] `OnboardingChatGateway` — комната = `chat:{chatId}`, только участники могут подписаться (использовать `JwtAuthGuard` для ws). Эмитить `message:created` после `SendOnboardingChatMessageHandler.execute`. **Подход:** handler возвращает событие, контроллер вызывает gateway. Либо завести легковесный EventBus (Nest умеет через `@nestjs/cqrs` `EventBus`, ирония — он же в deps лежит без дела).
- [ ] `NotificationsGateway` — комната = `user:{userId}`, эмитить `notification:created`.

### 6.3 Mail (MailHog уже поднят на 1025/8025)

- [ ] `nodemailer` в deps.
- [ ] `src/modules/mail/` — `MailService.send(template, to, vars)`. Шаблоны — handlebars или просто `.ts` функции. Для dev указывать `SMTP_HOST=localhost SMTP_PORT=1025`.
- [ ] Триггеры: приглашение сотрудника, назначение онбординга, новая запись на курс, сброс пароля.

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
2. **`course_applications` — что это за сущность теперь, без клиентов?** В схеме таблицы нет, но есть папка `src/modules/education/course-application/`. Раньше это мыслилось как «заявка клиента на курс» (b2c), но клиенты убраны. Варианты: (a) удалить папку, (b) переосмыслить как «заявка сотрудника на самозапись на курс с апрувом руководителя».
3. **Сколько попыток теста разрешено, есть ли проходной балл?** Влияет на `TestAttempt` use cases.
4. **Удаление сотрудника = soft (`dismissalDate`) или hard?** Я записал soft, подтвердить.
5. **Файлы — MinIO/S3 или локальный диск?** Сильно влияет на сложность фазы 3.
6. **Outbox/события или синхронные нотификации?** Tech-долг vs сложность с самого начала.
7. **Авто-назначение онбординга при создании Employee — желательно?** Если да — нужно поле `defaultDurationDays` в `OnboardingTemplate`.
8. **`Position.parent` иерархия — глубина выборки подчинённых?** Когда руководитель смотрит «мои подчинённые» (Phase 2.2) и «онбординги моих подчинённых» (Phase 5.2): возвращаем только прямых (1 уровень вниз) или всю ветку рекурсивно через `WITH RECURSIVE`? Решение влияет на сложность read-side и UX.
9. **Можно ли менять `User.roleId` после создания?** Если да — нужен `ChangeUserRoleCommand` (роль уходит в JWT, значит после смены роли нужно инвалидировать токены пользователя — `deleteMany tokens by userId`).
10. **`Position.parentId` при удалении родителя — `SetNull` подходит?** Сейчас в схеме именно так: подчинённые «отвязываются». Альтернатива — переподвесить их на parent удаляемого. Для корпсистемы скорее всего `SetNull` норм (HR потом руками настроит), подтвердить.

---

## Приоритеты (если выбирать одно за раз)

1. Phase 0 (filter + swagger) — 1 день.
2. Phase 1 — 2-3 дня. Без этого нельзя двигать ничего связанного с пользователями.
3. Phase 2.2 (Employee), 5 (доделать онбординг) — параллельно после Phase 1.
4. Phase 3 (Files) — когда понадобится для аватарок/обложек.
5. Phase 4 (Education) — самая объёмная, начинать после Phase 2.
6. Phase 6 (Realtime/Mail) — когда фронт начнёт просить.
7. Phase 7 — параллельно всему, минимум — тесты на domain после каждой фазы.
