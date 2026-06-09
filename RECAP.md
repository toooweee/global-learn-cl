# Global Learn — System Recap

## Что это за система

**Global Learn** — корпоративная LMS (система управления обучением) для внутрикорпоративного обучения сотрудников. Решает следующие задачи:

- Создание и управление структурированными учебными курсами с модулями, шагами (уроками и тестами)
- Запись сотрудников на курсы и отслеживание их прогресса
- Онбординг новых сотрудников по шаблонам, привязанным к должности и отделу
- Управление организационной структурой компании (департаменты, отделы, должности)
- Уведомления в реальном времени (WebSocket) и email-рассылки
- Разграничение доступа по ролям (Admin / Employee)

---

## Роли и права

Система использует **одну роль на пользователя** (хранится в JWT, проверяется `RolesGuard`).

| Роль | Кто | Что может |
|------|-----|-----------|
| **Admin** | HR-менеджер, руководитель | Управляет справочниками (департаменты, отделы, должности), создаёт/редактирует/архивирует курсы, записывает сотрудников, одобряет заявки, управляет онбординг-шаблонами, назначает онбординги, просматривает аналитику, редактирует любой профиль |
| **Employee** | Рядовой сотрудник | Просматривает курсы, подаёт заявки, проходит курсы и тесты, участвует в онбординге, пишет в чат, редактирует только свой профиль |

> Роль `Admin` создаётся через `POST /roles` и назначается при регистрации (`POST /auth/register`). На один аккаунт — одна роль.

---

## Как работает авторизация

1. Регистрация — только Admin: `POST /auth/register` → создаёт User + Employee + роль. Сотрудник получает email-инвайт, затем устанавливает пароль через `POST /auth/complete-registration`.
2. Вход: `POST /auth/login` → JWT Access Token (cookie `access_token`) + Refresh Token (cookie `refresh_token`, хранится в Redis).
3. Все эндпоинты защищены `JwtAuthGuard` глобально. Эндпоинты с `@Public()` доступны без токена.
4. Обновление токена: `POST /auth/refresh` (по refresh-cookie).
5. Выход: `POST /auth/logout` — удаляет refresh-сессию, чистит cookies.
6. Смена пароля: `POST /auth/change-password` — инвалидирует все сессии.

---

## Реализованные модули

### Identity — Аутентификация и пользователи

**Auth** `POST/GET /auth/*`
- `POST /auth/register` — регистрация сотрудника (Admin only)
- `POST /auth/complete-registration` — установка пароля по инвайту (@Public)
- `POST /auth/login` — вход (@Public)
- `POST /auth/refresh` — обновление токенов (@Public)
- `POST /auth/logout` — выход
- `POST /auth/change-password` — смена пароля
- `GET /auth/me` — текущий пользователь (id, email, роль)
- `GET /auth/me/profile` — полный профиль (user + role + employee + division + department + position)

**User** `GET /user/*` _(legacy, не использовать в продакшн)_
- `POST /user` — создать user напрямую (без Employee, без роли)
- `GET /user` / `GET /user/:id` — список и поиск

**Role** `/roles`
- `POST /roles` — создать роль (Admin)
- `GET /roles` — список (пагинация)
- `GET /roles/:id` / `DELETE /roles/:id`

---

### Organization — Организационная структура

**Department** `/departments` — CRUD, уникальны по имени  
**Division** `/divisions` — CRUD, фильтр по `departmentId`  
**Position** `/positions` — CRUD + `GET /positions/tree` (иерархическое дерево)

---

### Employee — Сотрудники

- `POST /employees` — создать (Admin: User + Employee + роль + division + position)
- `GET /employees` — список (пагинация, фильтры: `divisionId`, `departmentId`, `roleId`)
- `GET /employees/:id` — профиль сотрудника
- `PATCH /employees/:id` — обновить (fullname, biography, divisionId, positionId, **avatarId**); **только сам или Admin**
- `PATCH /employees/:id/promote` — сменить должность (Admin)
- `DELETE /employees/:id` — уволить, мягкое удаление (Admin)
- `GET /employees/me/subordinates` — прямые подчинённые

**Аватарка:** `POST /files` → получить `fileId` → передать как `avatarId` в `PATCH /employees/:id`.

---

### Files — Файлы и медиа

- `POST /files` — загрузить (multipart/form-data; только jpeg/png/webp/gif; макс 5 МБ) → MinIO/S3
- `GET /files/:id` — presigned URL для просмотра
- `DELETE /files/:id` — удалить файл

---

### Education — Обучение

#### Course — Курсы

- `POST /courses` — создать курс (Admin; `scope=ALL|DEPARTMENT|DIVISION`)
- `POST /courses/full` — создать курс с модулями и шагами атомарно (Admin)
- `GET /courses` — список (пагинация; фильтры: `scope`, `departmentId`, `divisionId`, `visibleToMe`, `includeArchived`); включает enrollment-прогресс текущего пользователя
- `GET /courses/:id` — детальная карточка; ответ содержит: `isArchived`, `author {id, fullname, avatarId}`, `scopeInfo`, `modules[].steps[]` (с `lessonName`, `lessonContent`, `testName`, `testPassingPercent`, `isCompleted`), `totalSteps`, `completedSteps`, `enrollment {status, startedAt, completedAt, completionRate}`
- `PATCH /courses/:id` — обновить метаданные (Admin)
- `DELETE /courses/:id` — удалить (Admin)
- `PATCH /courses/:id/archive` / `PATCH /courses/:id/unarchive` — архивирование (Admin); архивные курсы скрыты из `GET /courses` по умолчанию; запись на архивный курс заблокирована
- `GET /courses/analytics` — обзор всех курсов: enrollment stats — пагинация
- `GET /courses/:id/analytics` — аналитика по курсу: разбивка по department и division

**Генерация итоговых тестов:**
- `POST /courses/:id/generate-test` — создать итоговый тест по курсу из банка вопросов; имя: `"Итоговый тест по {courseName}"`; тело: `{ count?, passingPercent? }` (count опционален — по умолчанию все вопросы); возвращает ID нового теста (Admin)
- `POST /courses/:id/modules/:moduleId/generate-test` — создать итоговый тест по модулю; имя: `"Итоговый тест по модулю {moduleName}"`; то же тело (Admin)

**Управление структурой (Admin):**
- `POST /courses/:id/modules` / `DELETE /courses/:id/modules/:moduleId`
- `POST /courses/:id/modules/:moduleId/steps` / `DELETE .../steps/:stepId`

**Область видимости (scope):**
- `ALL` — всем сотрудникам
- `DEPARTMENT` — сотрудникам указанного департамента
- `DIVISION` — сотрудникам конкретного отдела

**Фильтр `visibleToMe=true`:** возвращает только курсы, доступные текущему пользователю по его division/department.

---

#### Course Question Bank — Банк вопросов курса

Вопросы привязаны к курсу и опционально к модулю (`moduleId`). Из банка формируются тесты.

- `POST /courses/:id/questions` — создать вопрос с ответами (Admin); `moduleId` — опционально
- `GET /courses/:id/questions` — полный банк курса (Admin); опциональный фильтр `?moduleId=`; каждый вопрос содержит `usedInTestsCount`
- `GET /courses/:id/modules/:moduleId/questions` — банк вопросов конкретного модуля (Admin); эквивалент `?moduleId=` с явным URL
- `GET /courses/:id/questions/stats` — статистика банка: `total`, `usedInTests`, `unused`, `byModule[]`
- `GET /questions/:id` — один вопрос по ID (с `usedInTestsCount`)
- `PATCH /questions/:id` — обновить текст и/или ответы (все ответы пересоздаются)
- `DELETE /questions/:id` — удалить (каскадно удаляет ответы и ссылки из тестов)

---

#### Lesson — Уроки

- `POST /lessons` — создать урок (name + content) — Admin
- `GET /lessons/:id` — получить урок по ID (любой авторизованный)
- `PATCH /lessons/:id` — обновить — Admin
- `DELETE /lessons/:id` — удалить — Admin

---

#### Test Definition — Тесты (определение)

Тест — набор вопросов из банка курса с порогом прохождения (`passingPercent`).

- `POST /test-definitions` — создать тест (Admin)
- `GET /test-definitions/:id` — тест с вопросами
- `PATCH /test-definitions/:id` — обновить name / passingPercent
- `DELETE /test-definitions/:id` — удалить

**Управление вопросами в тесте (Admin):**
- `POST /test-definitions/:id/questions` — добавить один вопрос из банка
- `POST /test-definitions/:id/questions/bulk` — добавить несколько сразу (`{ questionIds[] }`; идемпотентно)
- `DELETE /test-definitions/:id/questions/:questionId` — убрать вопрос
- `POST /test-definitions/:id/generate` — заменить все вопросы теста случайной выборкой из банка (`{ courseId, count, moduleId? }`)

---

#### Test Attempt — Прохождение тестов

- `POST /tests/:testId/attempts` — начать попытку; если уже есть активная (незавершённая) — **возвращает её ID** (resume), новую не создаёт
- `GET /tests/:testId/attempts` — история попыток текущего пользователя по данному тесту (новые сначала; содержит `isFinished`, `score`, `isPassed`)
- `GET /attempts/:id` — статус попытки (вопросы + текущие ответы)
- `POST /attempts/:id/answers` — ответить на вопрос (submit/update)
- `POST /attempts/:id/finish` → `{ correct, total, score, isPassed }` — завершить и получить результат

---

#### Enrollment — Записи на курс

- `POST /courses/:id/enroll` — записать сотрудника (Admin, body: `employeeId`); проверяет scope доступа; если статус `CANCELLED` — реактивирует запись
- `GET /courses/:id/enrollments` — все записи курса (Admin, пагинация)
- `GET /me/enrollments` — мои записи (пагинация)
- `GET /enrollments/:id` — детальная запись со step progress
- `DELETE /enrollments/:id` — отменить запись
- `POST /enrollments/:id/steps/:stepId/start` — начать шаг
- `POST /enrollments/:id/steps/:stepId/complete` — завершить шаг (автоматически завершает enrollment, если все шаги выполнены)

---

#### Course Application — Заявки на курс

- `POST /courses/:id/applications` — подать заявку (любой сотрудник)
- `GET /courses/:id/applications` — список заявок (Admin, фильтр по `status`)
- `PATCH /courses/:id/applications/:appId/approve` — одобрить (Admin) → enrollment + уведомление + email
- `PATCH /courses/:id/applications/:appId/reject` — отклонить (Admin)
- `GET /me/applications` — мои заявки (пагинация)

---

### Onboarding — Онбординг

#### Template — Шаблоны

- `POST /onboarding/templates` — создать (Admin); `divisionId` обязателен, `positionId` — **опционально**; если `positionId` не указан — шаблон действует для всего отдела без привязки к должности
- `GET /onboarding/templates` — список (фильтры: `positionId`, `divisionId`)
- `GET /onboarding/templates/:id` — шаблон с шагами и feedback-опциями
- `PUT /onboarding/templates/:id` — полное обновление (шаги пересоздаются)

Уникальность: одна пара `(positionId, divisionId)` — один шаблон; при `positionId = null` — один дивизионный шаблон для отдела.

Шаг: тип `TEXT` или `COURSE`; смещения `recommendedStartOffsetDays` / `recommendedEndOffsetDays`; предопределённые feedback-опции (чекбоксы).

#### Assignment — Назначение онбординга

- `POST /onboardings` — назначить (snapshot шаблона + чат в одной транзакции; email + уведомление)
- `GET /onboardings` — список (Admin; фильтры: `assignedToId`, `assignedById`, `status`)
- `GET /me/onboardings` / `GET /me/assigned-onboardings`
- `GET /onboardings/:id` — все шаги, статусы, feedback
- `POST /onboardings/:id/steps/:stepId/complete` — завершить шаг (feedback_text и/или выбор опций)
- `POST /onboardings/:id/cancel` — отменить онбординг

#### Chat — Чат онбординга

- `GET /onboardings/:id/chat/messages` — история (cursor-based: `before=<messageId>`)
- `POST /onboardings/:id/chat/messages` — отправить сообщение
- `POST /onboardings/:id/chat/messages/read` — отметить прочитанными

**WebSocket** (`/chat`): `subscribe { chatId }` → событие `message:created`.

---

### Notifications — Уведомления

- `GET /me/notifications` — уведомления (пагинация: `limit`, `page`)
- `POST /me/notifications/:id/read` — прочитать одно
- `POST /me/notifications/read-all` — прочитать все

**WebSocket** (`/notifications`): событие `notification:created` — push в реальном времени.

Уведомления отправляются при: одобрении заявки на курс, назначении онбординга.

---

### Mail — Email

- При назначении онбординга → письмо с датами
- При одобрении заявки на курс → письмо с названием курса

SMTP; в dev — MailHog (`localhost:8025`).

---

## Технический долг

### Некритические проблемы

| # | Проблема | Место | Влияние |
|---|----------|-------|---------|
| 1 | `POST /user` не защищён и не назначает роль | `user.controller.ts` | Создаёт невалидных пользователей |
| 2 | `SMTP_FROM` нет в `EnvSchema` | `mail.service.ts` | Нет валидации конфига |

### Что ещё требует внимания

| # | Что | Приоритет |
|---|-----|-----------|
| 1 | Тесты (unit/integration/e2e) — покрытие практически нулевое | Высокий |
| 2 | Health-check endpoint (`/health`) | Средний |
| 3 | CI: добавить `pnpm prisma generate` перед `pnpm build` | Средний |
| 4 | `prisma/seed.ts` — демо-данные | Низкий |

---

## Технический стек

| Компонент | Технология |
|-----------|-----------|
| Framework | NestJS + CQRS |
| ORM | Prisma 7 (adapter-pg) |
| Database | PostgreSQL |
| Cache / Sessions | Redis |
| File Storage | MinIO (S3-compatible) |
| Auth | JWT (access + refresh cookies) + Argon2 |
| Real-time | Socket.IO (WebSocket) |
| Email | Nodemailer + MailHog (dev) |
| Architecture | DDD + CQRS, bounded contexts |
| Validation | class-validator + class-transformer |
| Docs | Swagger UI `/api/docs` |

---

## Сводная таблица HTTP-эндпоинтов

| Группа | Эндпоинт | Метод | Роль |
|--------|----------|-------|------|
| **Auth** | `/auth/register` | POST | Admin |
| | `/auth/complete-registration` | POST | Public |
| | `/auth/login` | POST | Public |
| | `/auth/refresh` | POST | Public |
| | `/auth/logout` | POST | Any |
| | `/auth/change-password` | POST | Any |
| | `/auth/me` | GET | Any |
| | `/auth/me/profile` | GET | Any |
| **User** | `/user` | POST/GET | — |
| | `/user/:id` | GET | — |
| **Role** | `/roles` | POST/GET | Admin/Any |
| | `/roles/:id` | GET/DELETE | Any/Admin |
| **Department** | `/departments` | POST/GET | Admin/Any |
| | `/departments/:id` | GET/PATCH/DELETE | Any/Admin |
| **Division** | `/divisions` | POST/GET | Admin/Any |
| | `/divisions/:id` | GET/PATCH/DELETE | Any/Admin |
| **Position** | `/positions` | POST/GET | Admin/Any |
| | `/positions/tree` | GET | Any |
| | `/positions/:id` | GET/PATCH/DELETE | Any/Admin |
| **Employee** | `/employees` | POST/GET | Admin/Any |
| | `/employees/me/subordinates` | GET | Any |
| | `/employees/:id` | GET/PATCH/DELETE | Any/Self+Admin/Admin |
| | `/employees/:id/promote` | PATCH | Admin |
| **File** | `/files` | POST | Any |
| | `/files/:id` | GET/DELETE | Any |
| **Course** | `/courses` | POST/GET | Admin/Any |
| | `/courses/full` | POST | Admin |
| | `/courses/analytics` | GET | Any |
| | `/courses/:id` | GET/PATCH/DELETE | Any/Admin |
| | `/courses/:id/analytics` | GET | Any |
| | `/courses/:id/archive` | PATCH | Admin |
| | `/courses/:id/unarchive` | PATCH | Admin |
| | `/courses/:id/generate-test` | POST | Admin |
| | `/courses/:id/modules` | POST | Admin |
| | `/courses/:id/modules/:mId` | DELETE | Admin |
| | `/courses/:id/modules/:mId/steps` | POST | Admin |
| | `/courses/:id/modules/:mId/steps/:sId` | DELETE | Admin |
| | `/courses/:id/modules/:mId/generate-test` | POST | Admin |
| | `/courses/:id/modules/:mId/questions` | GET | Admin |
| | `/courses/:id/questions` | POST/GET | Admin |
| | `/courses/:id/questions/stats` | GET | Admin |
| | `/courses/:id/enroll` | POST | Admin |
| | `/courses/:id/enrollments` | GET | Admin |
| | `/courses/:id/applications` | POST/GET | Any/Admin |
| | `/courses/:id/applications/:appId/approve` | PATCH | Admin |
| | `/courses/:id/applications/:appId/reject` | PATCH | Admin |
| **Question** | `/questions/:id` | GET/PATCH/DELETE | Admin |
| **Lesson** | `/lessons` | POST | Admin |
| | `/lessons/:id` | GET/PATCH/DELETE | Any/Admin/Admin |
| **Test** | `/test-definitions` | POST | Admin |
| | `/test-definitions/:id` | GET/PATCH/DELETE | Admin |
| | `/test-definitions/:id/questions` | POST | Admin |
| | `/test-definitions/:id/questions/bulk` | POST | Admin |
| | `/test-definitions/:id/questions/:qId` | DELETE | Admin |
| | `/test-definitions/:id/generate` | POST | Admin |
| **Test Attempt** | `/tests/:testId/attempts` | POST/GET | Any |
| | `/attempts/:id` | GET | Any |
| | `/attempts/:id/answers` | POST | Any |
| | `/attempts/:id/finish` | POST | Any |
| **Enrollment** | `/me/enrollments` | GET | Any |
| | `/enrollments/:id` | GET/DELETE | Any |
| | `/enrollments/:id/steps/:stepId/start` | POST | Any |
| | `/enrollments/:id/steps/:stepId/complete` | POST | Any |
| **Application** | `/me/applications` | GET | Any |
| **Onboarding Template** | `/onboarding/templates` | POST/GET | Admin |
| | `/onboarding/templates/:id` | GET/PUT | Admin |
| **Onboarding** | `/onboardings` | POST/GET | Admin/Any |
| | `/me/onboardings` | GET | Any |
| | `/me/assigned-onboardings` | GET | Any |
| | `/onboardings/:id` | GET | Any |
| | `/onboardings/:id/steps/:stepId/complete` | POST | Any |
| | `/onboardings/:id/cancel` | POST | Any |
| **Chat** | `/onboardings/:id/chat/messages` | GET/POST | Any |
| | `/onboardings/:id/chat/messages/read` | POST | Any |
| **Notifications** | `/me/notifications` | GET | Any |
| | `/me/notifications/:id/read` | POST | Any |
| | `/me/notifications/read-all` | POST | Any |
