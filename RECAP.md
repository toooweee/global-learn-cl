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
| **Employee** | Рядовой сотрудник | Просматривает курсы, подаёт заявки на курсы, проходит курсы (start/complete step), проходит тесты, участвует в своём онбординге, пишет в чат, редактирует только свой профиль |

> Роль `Admin` создаётся через `POST /roles` и назначается при регистрации (`POST /auth/register`). Система не ограничивает количество ролей в словаре, но на один аккаунт — одна роль.

---

## Как работает авторизация

1. Регистрация сотрудника — только Admin: `POST /auth/register` → создаёт User + Employee + привязывает роль. Сотрудник получает email-инвайт, затем устанавливает пароль через `POST /auth/complete-registration`.
2. Вход: `POST /auth/login` → JWT Access Token (cookie `access_token`) + Refresh Token (cookie `refresh_token`, хранится в Redis).
3. Все эндпоинты защищены `JwtAuthGuard` (глобально). Эндпоинты с `@Public()` доступны без токена.
4. Обновление токена: `POST /auth/refresh` (по refresh-cookie).
5. Выход: `POST /auth/logout` — удаляет refresh-сессию, чистит cookies.
6. Смена пароля: `POST /auth/change-password` — инвалидирует все сессии.

---

## Реализованные модули (100%)

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

**User** `GET /user/*` _(legacy)_
- `POST /user` — создать user напрямую (без Employee, без роли — **не использовать**, оставлен для инфраструктурных нужд)
- `GET /user` — список users (пагинация)
- `GET /user/:id` — user по ID

**Role** `GET/POST/DELETE /roles/*`
- `POST /roles` — создать роль (Admin)
- `GET /roles` — список ролей (пагинация)
- `GET /roles/:id` — роль по ID
- `DELETE /roles/:id` — удалить роль (Admin)

---

### Organization — Организационная структура

**Department** `GET/POST/PATCH/DELETE /departments/*`
- CRUD: создать, обновить, удалить, получить по ID, список (пагинация)
- Уникальны по имени

**Division** `GET/POST/PATCH/DELETE /divisions/*`
- CRUD: создать (с `departmentId`), обновить, удалить, получить по ID, список (пагинация, фильтр по `departmentId`)

**Position** `GET/POST/PATCH/DELETE /positions/*`
- CRUD: создать (с опциональным `parentId`), обновить, удалить, получить по ID, список (пагинация)
- `GET /positions/tree` — иерархическое дерево должностей

---

### Employee — Сотрудники

`GET/POST/PATCH/DELETE /employees/*`
- `POST /employees` — создать (Admin: создаёт User + Employee + привязка роли, деления, должности)
- `GET /employees` — список (пагинация, фильтры: `divisionId`, `departmentId`, `roleId`)
- `GET /employees/:id` — профиль сотрудника
- `PATCH /employees/:id` — обновить (fullname, biography, divisionId, positionId, avatarId); **только сам сотрудник или Admin**
- `PATCH /employees/:id/promote` — повысить (сменить positionId, Admin)
- `DELETE /employees/:id` — уволить (мягкое удаление, Admin)
- `GET /employees/me/subordinates` — мои прямые подчинённые

**Аватарка:** загружается через `POST /files` → получаем `fileId` → передаём как `avatarId` в `PATCH /employees/:id`. Поле `avatarId` возвращается в ответе.

---

### Files — Файлы и медиа

`GET/POST/DELETE /files/*`
- `POST /files` — загрузить файл (multipart/form-data, только изображения: jpeg/png/webp/gif, макс 5 МБ) → сохраняет в MinIO/S3
- `GET /files/:id` — получить presigned URL для просмотра
- `DELETE /files/:id` — удалить файл

---

### Education — Обучение

#### Course — Курсы

`GET/POST/PATCH/DELETE /courses/*`

- `POST /courses` — создать курс (Admin, с областью: `scope=ALL|DEPARTMENT|DIVISION`)
- `POST /courses/full` — создать курс с модулями и шагами атомарно (Admin)
- `GET /courses` — список курсов (пагинация, фильтры: `scope`, `departmentId`, `divisionId`, `visibleToMe`, `includeArchived`) + прогресс текущего пользователя в каждом курсе
- `GET /courses/:id` — детальная карточка курса (все модули, шаги, isCompleted per step, enrollment progress)
- `PATCH /courses/:id` — обновить метаданные курса (Admin)
- `DELETE /courses/:id` — удалить курс (Admin)
- `PATCH /courses/:id/archive` — архивировать курс (Admin, скрывает из листингов)
- `PATCH /courses/:id/unarchive` — разархивировать курс (Admin)
- `POST /courses/:id/modules` — добавить модуль (Admin)
- `DELETE /courses/:id/modules/:moduleId` — удалить модуль (Admin)
- `POST /courses/:id/modules/:moduleId/steps` — добавить шаг (Admin)
- `DELETE /courses/:id/modules/:moduleId/steps/:stepId` — удалить шаг (Admin)
- `GET /courses/analytics` — обзор всех курсов: enrollment stats (inProgress/completed/cancelled) — пагинация
- `GET /courses/:id/analytics` — аналитика по курсу: разбивка по department и division

**Область видимости курса (scope):**
- `ALL` — курс доступен всем сотрудникам
- `DEPARTMENT` — курс для всех сотрудников департамента (требует `departmentId`)
- `DIVISION` — курс для конкретного отдела (требует `divisionId`)

**Фильтр `visibleToMe=true`:** определяет division/department текущего пользователя и возвращает курсы, доступные ему по scope (`ALL` + курсы своего department + курсы своего division).

**Архивирование:** Флаг `isArchived` на курсе. `GET /courses` по умолчанию скрывает архивные (передайте `includeArchived=true` чтобы включить). Запись на архивный курс заблокирована.

> В `GET /courses` и `GET /courses/:id` автоматически подтягивается enrollment-прогресс текущего авторизованного пользователя: `completedSteps / totalSteps`, `completionRate`, `status`.

#### Course Question Bank — Банк вопросов курса

- `POST /courses/:id/questions` — создать вопрос с ответами для банка курса (Admin)
- `GET /courses/:id/questions` — список вопросов курса (Admin)
- `PATCH /questions/:id` — обновить вопрос и/или ответы (Admin; при обновлении ответов все старые заменяются новыми)
- `DELETE /questions/:id` — удалить вопрос (Admin, каскадно удаляет ответы и ссылки из тестов)

#### Lesson — Уроки

`GET/POST/PATCH/DELETE /lessons/*`
- `POST /lessons` — создать урок (name + content в markdown/html) — Admin
- `GET /lessons/:id` — получить урок по ID (любой авторизованный)
- `PATCH /lessons/:id` — обновить урок — Admin
- `DELETE /lessons/:id` — удалить урок — Admin

#### Test Definition — Тесты (определение)

`POST/GET/PATCH/DELETE /test-definitions/*` (Admin only)
- `POST /test-definitions` — создать тест (name, passingPercent)
- `GET /test-definitions/:id` — тест с вопросами
- `PATCH /test-definitions/:id` — обновить тест
- `DELETE /test-definitions/:id` — удалить тест
- `POST /test-definitions/:id/questions` — добавить вопрос из банка курса в тест
- `DELETE /test-definitions/:id/questions/:questionId` — убрать вопрос из теста

#### Test Attempt — Прохождение тестов

`POST/GET /tests/:testId/attempts`, `/attempts/*`
- `POST /tests/:testId/attempts` — начать попытку (блокирует старт, если уже есть активная незавершённая попытка)
- `GET /attempts/:id` — статус попытки (вопросы + текущие ответы)
- `POST /attempts/:id/answers` — ответить на вопрос (submit/update answer)
- `POST /attempts/:id/finish` → `{ correct, total, score, isPassed }` — завершить и получить результат

#### Enrollment — Записи на курс

- `POST /courses/:id/enroll` — записать сотрудника (Admin, body: `employeeId`); проверяет scope доступа
- `GET /courses/:id/enrollments` — все записи курса (Admin, пагинация)
- `GET /me/enrollments` — мои записи (пагинация)
- `GET /enrollments/:id` — детальная запись со step progress
- `DELETE /enrollments/:id` — отменить запись
- `POST /enrollments/:id/steps/:stepId/start` — начать шаг
- `POST /enrollments/:id/steps/:stepId/complete` — завершить шаг (автоматически завершает enrollment, если все шаги выполнены)

**Re-enrollment:** Если у сотрудника есть запись со статусом `CANCELLED`, повторный `POST /courses/:id/enroll` очищает прогресс и реактивирует запись (сбрасывает статус в `IN_PROGRESS`).

#### Course Application — Заявки на курс

- `POST /courses/:id/applications` — подать заявку (любой сотрудник)
- `GET /courses/:id/applications` — список заявок (Admin, фильтр по `status`)
- `PATCH /courses/:id/applications/:appId/approve` — одобрить (Admin) → автоматически создаёт enrollment + уведомление + email
- `PATCH /courses/:id/applications/:appId/reject` — отклонить (Admin)
- `GET /me/applications` — мои заявки (пагинация)

---

### Onboarding — Онбординг

#### Template — Шаблоны онбординга

`GET/POST/PUT /onboarding/templates/*` (Admin only)
- `POST /onboarding/templates` — создать шаблон (привязывается к `positionId` + `divisionId`, уникальный)
- `GET /onboarding/templates` — список шаблонов (фильтры: `positionId`, `divisionId`)
- `GET /onboarding/templates/:id` — шаблон с шагами и feedback-опциями
- `PUT /onboarding/templates/:id` — полное обновление шаблона (шаги пересоздаются)

**Шаг шаблона:**
- Тип `TEXT` или `COURSE`
- `recommendedStartOffsetDays` / `recommendedEndOffsetDays` — смещение в днях от даты старта онбординга
- Feedback-опции — предопределённые варианты выполнения шага (чекбоксы)

#### Assignment — Назначение онбординга

`GET/POST /onboardings/*`
- `POST /onboardings` — назначить онбординг из шаблона (создаёт снимок шагов + чат атомарно; email + уведомление assignedTo)
- `GET /onboardings` — список всех онбордингов (Admin, фильтры: `assignedToId`, `assignedById`, `status`)
- `GET /me/onboardings` — мои онбординги (сотрудник)
- `GET /me/assigned-onboardings` — онбординги, назначенные мной (менеджер)
- `GET /onboardings/:id` — детальный онбординг (все шаги, статусы, feedback)
- `POST /onboardings/:id/steps/:stepId/complete` — завершить шаг (с feedback_text и/или выбором опций)
- `POST /onboardings/:id/cancel` — отменить онбординг

**Логика онбординга:**
- При назначении шаблон "снимается" (snapshot) — дальнейшие изменения шаблона не влияют на активный онбординг
- Дата `recommendedStart/EndOffsetDays` материализуется в конкретные даты при назначении
- Чат создаётся одновременно с онбордингом в одной транзакции

#### Chat — Чат онбординга

`GET/POST /onboardings/:onboardingId/chat/messages`
- `GET /onboardings/:onboardingId/chat/messages` — история (cursor-based пагинация, `before=<messageId>`)
- `POST /onboardings/:onboardingId/chat/messages` — отправить сообщение
- `POST /onboardings/:onboardingId/chat/messages/read` — отметить прочитанными

**WebSocket** (`/chat` namespace):
- `subscribe { chatId }` — подписаться на чат-комнату
- Событие `message:created` — новое сообщение в реальном времени

---

### Notifications — Уведомления

`GET/POST /me/notifications/*`
- `GET /me/notifications` — уведомления пользователя (пагинация: `limit`, `page`)
- `POST /me/notifications/:id/read` — отметить одно уведомление прочитанным
- `POST /me/notifications/read-all` — отметить все прочитанными

**WebSocket** (`/notifications` namespace):
- Аутентификация по токену в handshake
- Событие `notification:created` — push-уведомление в реальном времени

**Уведомления отправляются при:**
- Одобрении заявки на курс (`COURSE_APPLICATION_APPROVED`)
- Назначении онбординга (в сервисе assign-onboarding)

---

### Mail — Email

Отправка email через SMTP (MailHog в dev):
- При назначении онбординга → письмо с датами (`sendOnboardingAssigned`)
- При одобрении заявки на курс → письмо с названием курса (`sendCourseEnrollmentApproved`)

---

## Проблемы и технический долг

### Исправленные проблемы

| # | Проблема | Статус |
|---|----------|--------|
| 2 | `GET /lessons/:id` отсутствовал | ✅ Добавлен |
| 3 | `PATCH /employees/:id` — любой мог редактировать чужой профиль | ✅ Проверка: только сам или Admin |
| 4 | `UserPrismaRepository` использовал `this.prismaService.client` напрямую | ✅ Уже использовал `this.db` |
| 5 | Дублирующиеся файлы `enrollment/application/create-enrollment/` | ✅ Удалены дубликаты |
| 6 | `education/module/` — мёртвый код (неиспользуемые create/delete-module) | ✅ Папка удалена |

### Оставшиеся / некритические

| # | Проблема | Место | Влияние |
|---|----------|-------|---------|
| 1 | `POST /user` не защищён (`@Roles`) и не назначает роль | `user.controller.ts` | Может создавать невалидных пользователей |
| 7 | `SMTP_FROM` нет в `EnvSchema` — env читается напрямую в `mail.service.ts` | `mail.service.ts` | Отсутствие валидации конфига |

### Реализованный ранее отсутствующий функционал

| # | Что реализовано |
|---|-----------------|
| 1 | `visibleToMe` фильтр в `GET /courses` — курсы по scope текущего пользователя |
| 2 | `GET /lessons/:id` — прямой просмотр контента урока |
| 3 | `PATCH /questions/:id` — редактирование вопроса и ответов |
| 4 | Проверка scope при записи на курс (`CreateEnrollmentCommandHandler`) |
| 5 | Re-enrollment после статуса CANCELLED — очистка прогресса + реактивация |
| 6 | Блокировка повторного старта теста при активной незавершённой попытке |
| 7 | Архивирование курса (`isArchived`, `PATCH /courses/:id/archive|unarchive`) |
| 8 | Пагинация уведомлений (`limit/page` вместо захардкоженных 50) |
| 9 | Защита `PATCH /employees/:id` — только сам или Admin |

### Что ещё требует внимания

| # | Что отсутствует | Приоритет |
|---|-----------------|-----------|
| 1 | Health-check endpoint (`/health`) | Средний (нужен для prod/k8s) |
| 2 | `prisma/seed.ts` — демо-данные для разработки | Низкий |
| 3 | CI: `pnpm prisma generate` перед `pnpm build` в `.github/workflows/ci.yaml` | Средний |
| 4 | Тесты (unit/integration/e2e) — покрытие практически нулевое | Высокий |
| 5 | `POST /user` — защитить или убрать (Admin only) | Низкий |

### Pending: миграция базы данных

После всех изменений необходимо выполнить:

```bash
pnpm prisma migrate dev --name course-archive
```

Это применит поле `is_archived BOOLEAN DEFAULT false` к таблице `courses`.

---

## Технический стек

| Компонент | Технология |
|-----------|-----------|
| Framework | NestJS + CQRS |
| ORM | Prisma 7 (adapter-pg) |
| Database | PostgreSQL |
| Cache / Sessions | Redis |
| File Storage | MinIO (S3-compatible) |
| Auth | JWT (access cookie + refresh cookie) + Argon2 |
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
| | *(фильтры GET: divisionId, departmentId, roleId)* | | |
| **File** | `/files` | POST | Any |
| | `/files/:id` | GET/DELETE | Any |
| **Course** | `/courses` | POST/GET | Admin/Any |
| | `/courses/full` | POST | Admin |
| | `/courses/analytics` | GET | Any |
| | `/courses/:id` | GET/PATCH/DELETE | Any/Admin |
| | `/courses/:id/analytics` | GET | Any |
| | `/courses/:id/archive` | PATCH | Admin |
| | `/courses/:id/unarchive` | PATCH | Admin |
| | `/courses/:id/modules` | POST | Admin |
| | `/courses/:id/modules/:mId` | DELETE | Admin |
| | `/courses/:id/modules/:mId/steps` | POST | Admin |
| | `/courses/:id/modules/:mId/steps/:sId` | DELETE | Admin |
| | `/courses/:id/questions` | POST/GET | Admin |
| | `/questions/:id` | PATCH/DELETE | Admin |
| **Lesson** | `/lessons` | POST | Admin |
| | `/lessons/:id` | GET/PATCH/DELETE | Any/Admin/Admin |
| **Test** | `/test-definitions` | POST | Admin |
| | `/test-definitions/:id` | GET/PATCH/DELETE | Admin |
| | `/test-definitions/:id/questions` | POST/DELETE | Admin |
| **Test Attempt** | `/tests/:testId/attempts` | POST | Any |
| | `/attempts/:id` | GET | Any |
| | `/attempts/:id/answers` | POST | Any |
| | `/attempts/:id/finish` | POST | Any |
| **Enrollment** | `/courses/:id/enroll` | POST | Admin |
| | `/courses/:id/enrollments` | GET | Admin |
| | `/me/enrollments` | GET | Any |
| | `/enrollments/:id` | GET/DELETE | Any |
| | `/enrollments/:id/steps/:stepId/start` | POST | Any |
| | `/enrollments/:id/steps/:stepId/complete` | POST | Any |
| **Application** | `/courses/:id/applications` | POST/GET | Any/Admin |
| | `/courses/:id/applications/:appId/approve` | PATCH | Admin |
| | `/courses/:id/applications/:appId/reject` | PATCH | Admin |
| | `/me/applications` | GET | Any |
| **Onboarding Template** | `/onboarding/templates` | POST/GET | Admin |
| | `/onboarding/templates/:id` | GET/PUT | Admin |
| **Onboarding** | `/onboardings` | POST/GET | Any/Any |
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
