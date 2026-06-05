# ROADMAP

Это план «как достроить приложение». Написан в первую очередь для будущих сессий Claude, поэтому
пишу плотно, со ссылками на конкретные файлы, и фиксирую решения, которые ещё надо принять.

Состояние на момент написания:
- БД полностью описана (см. `prisma/schema.prisma` + `CLAUDE.md` → «Database schema»).
- Wired-up модули: `EnvModule`, `PrismaModule`, `RequestContextModule`, `UserModule` (пустой), `OnboardingModule` (полный — template / assignment / chat).
- Куча скелетов под use cases в `src/modules/{employee,education/*,identity/auth}` — папки и пустые `.ts` файлы. Не выкидывать без причины: они отражают замысел. Все они должны переехать на `@nestjs/cqrs` `CommandBus` (см. эталон в `src/modules/onboarding/**/application/**.command-handler.ts`).
- Валидация HTTP-запросов: **`class-validator` + `class-transformer`** (DTO в `presentation/dto/`). Ответы — классы из `src/libs/application/` (`IdResponseDto` / `BaseResponseDto` / `PaginatedResponseDto<T>`) с `@Exclude` на классе и `@Expose` на полях. `zod` оставлен только для `EnvSchema`.
- Redis объявлен в `.env` / `EnvSchema`, но не используется. MailHog поднят, но мейлера нет.

> Перед каждой большой фазой проверять: `pnpm lint && pnpm build && pnpm test`. Прогон `pnpm prisma generate` нужен после любых изменений `schema.prisma`. Node берём из `.nvmrc` (24.15.0) — Node 18 ломает Prisma 7 CLI (см. ошибку `ERR_REQUIRE_ESM` в zeptomatch).

---

## Phase 0 — Кросс-режущая инфраструктура (быстрые, разблокирующие задачи)

Эти штуки тривиальны, но без них последующие фазы будут писаться криво.

- [ ] **Global exception filter**: `src/libs/exceptions/domain-exception.filter.ts` — маппит ошибки из домена (например `new Error('Cannot complete a step out of order')`) в `HttpException`. Сейчас домен бросает голые `Error`, контроллер отдаст 500 (а с `CommandBus` ошибка вырывается из `commandBus.execute` без обёртки). Завести базовые типы: `DomainError`, `ConflictError`, `NotFoundError`, `ForbiddenError`. Зарегистрировать `APP_FILTER` в `AppModule` рядом с `APP_INTERCEPTOR`.
- [ ] **Заменить `throw new Error(...)` в `OnboardingEntity`/`OnboardingChatEntity`/`OnboardingTemplateEntity`** на доменные классы из пункта выше. Прямо сейчас это работает, но `cancel()` бросает `Error`, который наружу выйдет как 500.
- [ ] **Swagger**: подключить `@nestjs/swagger` + `nestjs-zod` адаптер (`patchNestJsSwagger()`), смонтировать на `/docs`. Без этого фронт будет писаться вслепую.
- [ ] **Логгер с correlationId**: `ContextInterceptor` уже кладёт `requestId`. Сделать `LoggerService` (pino?), который читает его из `RequestContextService.getRequestId()` и добавляет в каждый лог. Подключить через `app.useLogger(...)` в `src/main.ts`.
- [ ] **Расширить `EnvSchema`**: добавить `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `JWT_ACCESS_TTL`, `JWT_REFRESH_TTL`, `SMTP_HOST`, `SMTP_PORT`, `FILES_*` (см. фазу 3). `.env.example` обновить в той же PR.
- [ ] **`AppRequestContext.userId`**: добавить поле и заполнять в `AuthGuard` (фаза 1). `Command` уже умеет читать `metadata.userId`, но сейчас в `command.base.ts` это просто `props?.metadata?.userId` — добавить fallback на `RequestContextService.getUserId()`, чтобы каждая команда автоматически знала актора.

---

## Phase 1 — Auth & Identity (блокирует ВСЁ остальное)

Сейчас контроллеры онбординга принимают `assignedById` / `senderId` в теле запроса — это временная заглушка. После auth-слоя их надо переключить на текущего пользователя.

### 1.1 Хеширование паролей

- [ ] Добавить `argon2` (предпочтительно) либо `bcrypt` в зависимости.
- [ ] `src/libs/crypto/password.service.ts` — `hash(plain)` / `verify(hash, plain)`. Положить в отдельный `CryptoModule` или внутрь `AuthModule`.

### 1.2 Token module (`src/modules/identity/token/`)

Папка уже есть, пустая. Цель — refresh-token rotation.

- [ ] Завести `RefreshToken` модель в `schema.prisma`: `id`, `userId`, `tokenHash` (хранить хеш, не сам токен), `expiresAt`, `revokedAt`, `replacedById?`, `userAgent?`, `ip?`. Индекс `(userId, revokedAt)`.
- [ ] `TokenService` — выпуск access (JWT, короткий TTL) и refresh (opaque, длинный TTL, в БД). Использовать `JWT_ACCESS_SECRET` и `JWT_REFRESH_SECRET` из `EnvService`.
- [ ] Стратегия ротации: при `refresh` — отметить старый `revokedAt`, выпустить новый, проставить `replacedById`. Это даёт детект «токен использован повторно после ротации» → инвалидировать всю цепочку.

### 1.3 Auth module (`src/modules/identity/auth/`)

Скелеты есть — заполнить:

- [ ] `register.command(-handler).ts` — *новый*, не было даже скелета. Создаёт `User` + создаёт `Employee` ИЛИ `Client` (зависит от роли). Обернуть в `repo.transaction()`.
- [ ] `complete-registration.*` — для приглашённых сотрудников (когда HR создал `Employee` без пароля и выслал инвайт; пользователь приходит и выставляет пароль).
- [ ] `login.*` — сверить пароль, выпустить access+refresh.
- [ ] `refresh-tokens` — заполнить `refresh-token.command-handler.ts` (handler-файла нет, только `.command.ts`).
- [ ] `logout.*` — пометить текущий refresh `revokedAt`.
- [ ] `change-password.*` — старый пароль + новый, выпустить новую пару токенов, ревокнуть всё остальное у юзера.

### 1.4 Guards / Decorators

- [ ] `JwtAuthGuard` — парсит `Authorization: Bearer ...`, верифицирует, кладёт `userId` в `AppRequestContext`. Регистрировать как `APP_GUARD` глобально + `@Public()` декоратор для исключений (auth-эндпоинты).
- [ ] `RolesGuard` + `@Roles('admin', 'manager')` — читает роли из БД (или из JWT, если упаковать). Решение: **роли класть в access-токен**, чтобы не ходить в БД на каждый запрос; инвалидировать через короткий access-TTL.
- [ ] `@CurrentUser()` param-декоратор — достаёт юзера из контекста.

### 1.5 Seed ролей

- [ ] `prisma/seed.ts` — `admin`, `hr`, `manager`, `employee`, `client`. Регистрировать `prisma.config.ts` → `seed`. (Сейчас seed-скрипта нет.)

### 1.6 Пост-условие

- [ ] В контроллерах онбординга убрать `assignedById` / `senderId` из body — брать из `@CurrentUser()`. Обновить Zod-схемы соответственно.

---

## Phase 2 — Organization & People (depends on Phase 1)

Каркас в `src/modules/employee/` есть, но пустой. Нужны ещё модули для словарей.

### 2.1 Department / Division / Position

- [ ] `src/modules/organization/department/` — entity (по образцу onboarding template), репозиторий, CRUD use cases, контроллер. Защитить ролью `admin`/`hr`.
- [ ] То же для `division/` (с FK на department) и `position/`.

### 2.2 Employee (`src/modules/employee/`)

Скелеты есть:

- [ ] `domain/employee.entity.ts` — собрать по образцу `OnboardingTemplateEntity`. `Props`: `fullname`, `biography?`, `employmentDate`, `dismissalDate?`, `divisionId`, `positionId?`, `avatarId?`.
- [ ] Use cases: `create-employee` (создаёт `User`+`Employee` атомарно через `repo.transaction`), `update-employee`, `delete-employee` (либо мягкое удаление через `dismissalDate`, либо каскад через `User` cascade). Решение: **`delete` = выставление `dismissalDate`**, не удалять данные.
- [ ] Дополнительно: `promote-employee` (смена `positionId`) — это может триггерить новое назначение онбординга (фаза 5).

### 2.3 Client / ClientCompany (`src/modules/client/`)

- [ ] По аналогии. Контроллеры — для админки.

### 2.4 User module (`src/modules/identity/user/`)

- [ ] `user.repository.port.ts` (сейчас пустой) — `findById`, `findByEmail`, `save`.
- [ ] `user-prisma.repository.ts` — реализация.
- [ ] `UserService` (сейчас пустой класс) — только то, что нужно auth/employee/client модулям. Хорошо бы переехать на репозиторий и убрать сервис вообще.

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

Что уже есть: создание шаблона, назначение, complete-step, отправка сообщения в чат. Что недоделано:

- [ ] `UpdateOnboardingTemplate` use case (сейчас `save()` в `OnboardingTemplatePrismaRepository` умеет апдейтить только метаданные — нет логики diff-а шагов и опций; см. строки 40–75 `template-prisma.repository.ts`). Подход: при апдейте `replaceSteps` — снести и создать заново внутри транзакции. Шаги шаблона можно безопасно пересоздавать — они НЕ ссылаются на работающие назначения (там материализованные snapshot-копии).
- [ ] `CancelOnboarding` use case (метод в entity уже есть — `OnboardingEntity.cancel()`, дёрнуть из handler).
- [ ] Read-сторона: `GetOnboardingById`, `ListMyOnboardings` (для сотрудника), `ListAssignedByMe` (для руководителя). Сейчас репозиторий уже умеет `findByAssignee`. Контроллер `GET /onboardings`, `GET /onboardings/:id`.
- [ ] Read-сторона для чата: `GET /onboardings/:id/chat/messages?cursor=...` + пометка `read_at` через `MarkMessagesRead` use case.
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
2. **`course_applications` — что это за сущность?** В схеме нет такой таблицы, но есть папка `src/modules/education/course-application/`. Похоже это был наброс под «заявку на запись на курс» для клиентской стороны (b2c). Если так — нужна таблица.
3. **Сколько попыток теста разрешено, есть ли проходной балл?** Влияет на `TestAttempt` use cases.
4. **Удаление сотрудника = soft (`dismissalDate`) или hard?** Я записал soft, подтвердить.
5. **Файлы — MinIO/S3 или локальный диск?** Сильно влияет на сложность фазы 3.
6. **Outbox/события или синхронные нотификации?** Tech-долг vs сложность с самого начала.
7. **Авто-назначение онбординга при создании Employee — желательно?** Если да — нужно поле `defaultDurationDays` в `OnboardingTemplate`.

---

## Приоритеты (если выбирать одно за раз)

1. Phase 0 (filter + swagger) — 1 день.
2. Phase 1 — 2-3 дня. Без этого нельзя двигать ничего связанного с пользователями.
3. Phase 2.2 (Employee), 5 (доделать онбординг) — параллельно после Phase 1.
4. Phase 3 (Files) — когда понадобится для аватарок/обложек.
5. Phase 4 (Education) — самая объёмная, начинать после Phase 2.
6. Phase 6 (Realtime/Mail) — когда фронт начнёт просить.
7. Phase 7 — параллельно всему, минимум — тесты на domain после каждой фазы.
