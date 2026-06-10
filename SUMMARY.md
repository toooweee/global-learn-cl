# GlobalLearn API — System Recap

> Дата: 2026-06-10. Стек: NestJS 11 + Prisma + PostgreSQL + Redis + S3 (MinIO).

---

## 1. Что точно работает

### Identity & Auth
- Регистрация сотрудника: Admin вызывает `POST /api/auth/register` (без пароля) — генерируется invite-токен (TTL 7 дней), отправляется email со ссылкой.
- `POST /api/auth/complete-registration` — сотрудник устанавливает пароль по токену из письма. Токен валидируется, одноразовый.
- `POST /api/auth/forgot-password` — запрос сброса пароля; всегда возвращает 200 (защита от email enumeration); отправляет ссылку на почту.
- `POST /api/auth/reset-password` — сброс пароля по токену (TTL 1 час); инвалидирует все refresh-токены пользователя.
- Login / logout / refresh tokens (RT в httpOnly-cookie).
- `GET /api/auth/me` и `GET /api/auth/me/profile` — текущий пользователь + полный профиль.
- `POST /api/auth/change-password` — смена пароля (инвалидирует все сессии).
- JWT-гард глобально; `@Public()` — публичные маршруты; `@Roles(...)` через `RolesGuard`.

### User / Role Management
- Полный CRUD для `User` и `Role` (создание, листинг, удаление).
- Роли — одна на пользователя (1:1). Seeder создаёт 5 ролей: `admin`, `department_head`, `division_head`, `senior_manager`, `manager`.
- **Роль автоматически выводится из должности** при создании/повышении сотрудника — в API `roleId` не передаётся. Маппинг: `Руководитель Департамента` → `department_head`, `Руководитель отдела` → `division_head`, `Старший Менеджер` → `senior_manager`, остальные → `manager`.
- При повышении (`PATCH /employees/:id/promote`) роль пересчитывается автоматически.

### Organization
- Полный CRUD для `Department`, `Division`, `Position`.
- Иерархия должностей (`parentId`): `GET /api/positions/tree` возвращает вложенное дерево.

### Employee
- Создание (без пароля — invite flow), обновление, увольнение (мягкое удаление через `deletedAt`), повышение (смена division/position).
- `GET /api/employees/me/subordinates` — прямые подчинённые (одним уровнем ниже по дереву должностей).
- `GET /api/employees/me/subordinates/tree` — иерархическое дерево подчинённых (орг-чарт): рекурсивно по всем уровням, узел = должность с вложенными сотрудниками и дочерними должностями.
- `GET /api/employees/me/team-dashboard` — дашборд менеджера: рекурсивный обход дерева должностей, прогресс enrollments и активный онбординг по каждому подчинённому, сводная статистика.
- `SubordinateCheckService` — переиспользуемый сервис BFS-обхода дерева должностей; используется для проверки "является ли сотрудник подчинённым менеджера" в enrollment и onboarding assignment.
- Фильтрация списка по `divisionId`, `departmentId`.

### Files
- Upload (JPEG/PNG/WebP/GIF, лимит 5 МБ) → S3/MinIO, presigned URL, удаление.

### Onboarding — Template
- Создание и обновление шаблона (позиция + подразделение, шаги типа `TEXT`/`COURSE`, feedback-options, offsets в днях).
- Листинг с фильтрами `positionId`/`divisionId`.

### Onboarding — Assignment
- Назначение онбординга сотруднику: создаёт snapshot шагов с resolved датами, создаёт чат, отправляет email и push-уведомление. Manager может назначать только своим подчинённым.
- Завершение шага (выбор feedback-options / текст), отмена онбординга.
- Фильтруемые списки: мои онбординги, назначенные мной, все (Admin).

### Onboarding — Chat
- HTTP: отправка сообщения, листинг с пагинацией, пометка как прочитанных.
- WebSocket (namespace `chat`): JWT-аутентификация при коннекте, подписка на `chat:<chatId>`, real-time событие `message:created`.

### Education — Courses
- Создание курса, `POST /api/courses/full` (атомарно: курс + модули + шаги).
  - **Admin**: курс сразу `PUBLISHED`.
  - **Manager**: курс создаётся как `DRAFT`, затем `PATCH /courses/:id/submit` → `PENDING_REVIEW` → Admin `PATCH /courses/:id/publish` / `reject`.
- Обновление, удаление, архивирование / разархивирование — Admin + (Manager для своих DRAFT-курсов).
- Статусы курса: `DRAFT | PENDING_REVIEW | PUBLISHED | REJECTED`. Manager видит только `PUBLISHED` + свои собственные (любой статус). Employee — только `PUBLISHED`.
- `GET /api/courses/analytics` — дашборд (количество курсов, enrollments по статусам).
- `GET /api/courses/:id/analytics` — аналитика по курсу: разбивка enrollments по department/division.
- Scopes курса: `ALL` / `DEPARTMENT` / `DIVISION`; enforcement применяется для non-Admin.
- Фильтры списка: `search` (full-text по названию), `authorId`, `scope`, `departmentId`, `divisionId`, `visibleToMe`, `includeArchived`.

### Education — Lessons & Tests
- CRUD для `Lesson` (контент, видео через `files`).
- CRUD для `TestDefinition` (passingPercent, вопросы).
- Банк вопросов (`CourseQuestion` / `CourseAnswer`), статистика банка, фильтр по `moduleId`.
- Авто-генерация теста: по курсу (`POST /courses/:id/generate-test`), по модулю (`POST /courses/:id/modules/:moduleId/generate-test`). При генерации по модулю: сначала ищет вопросы с `moduleId`, при отсутствии — fallback на все вопросы курса.
- Bulk-добавление вопросов в тест.

### Education — Enrollments
- Запись сотрудника на курс (Admin / Manager), bulk-запись (`POST /api/courses/:id/enroll/bulk`). Manager может записывать только своих подчинённых (проверка через `SubordinateCheckService`); Admin — без ограничений.
- Старт / завершение шага с проверкой порядка; при завершении всех шагов enrollment → `COMPLETED` и **автоматически выдаётся сертификат**.
- Листинг: мои записи, по курсу.

### Education — Certificates
- `GET /api/me/certificates` — список моих сертификатов (employeeName + courseName, issuedAt).
- `GET /api/certificates/:id` — **публичный** эндпоинт для верификации сертификата по ID.
- Таблица `course_certificates`; уникальный ключ по `enrollment_id`; idempotent upsert (безопасно при повторном вызове).

### Education — Course Applications
- Заявка сотрудника на курс, одобрение (Admin → уведомление + email) / отклонение.
- Уникальная заявка per `(courseId, employeeId)`.

### Education — Test Attempts
- Старт попытки (если активная есть — возвращает её id), ответ на вопросы, финиш (вычисляет score, isPassed).

### Notifications
- In-app уведомления: при назначении онбординга, одобрении заявки на курс, завершении онбординга (сотрудник + менеджер), повышении сотрудника, просроченном шаге онбординга.
- WebSocket (namespace `notifications`): клиент подключается с JWT, получает комнату `user:<userId>`, сервер шлёт `notification:created`.
- HTTP: листинг моих уведомлений, пометка одного/всех как прочитанных.

### Mail
| Событие | Метод | Триггер |
|---------|-------|---------|
| Создание сотрудника | `sendEmployeeInvite` | `CreateEmployeeCommandHandler` |
| Сброс пароля | `sendPasswordReset` | `ForgotPasswordCommandHandler` |
| Назначение онбординга | `sendOnboardingAssigned` | `AssignOnboardingCommandHandler` |
| Одобрение заявки на курс | `sendCourseEnrollmentApproved` | `ApproveCourseApplicationCommandHandler` |
| Завершение онбординга | `sendOnboardingCompleted` | `CompleteOnboardingStepHandler` (при завершении последнего шага) |
| Повышение сотрудника | `sendEmployeePromoted` | `PromoteEmployeeCommandHandler` |

SMTP через Nodemailer (MailHog локально). `APP_URL` в `.env` управляет базовым URL ссылок в письмах.

### Cron / Планировщик
- `@nestjs/schedule` + `ScheduleModule.forRoot()` зарегистрированы в `AppModule`.
- `OnboardingInactivityService` — ежедневно в 9:00 ищет шаги онбординга, чей `recommendedEndDate` прошёл вчера и не выполнены; отправляет in-app уведомление `ONBOARDING_STEP_OVERDUE` сотруднику и `ONBOARDING_STEP_OVERDUE_MANAGER` менеджеру (fire-and-forget). Уведомление срабатывает ровно один раз — в день наступления дедлайна.

---

## 2. Что не работает / сломано

| # | Проблема | Где | Последствие | Статус |
|---|---------|-----|-------------|--------|
| 1 | **0% test coverage** | Весь проект | Нет уверенности в корректности рефакторинга. Единственный spec — `app.controller.spec.ts`. | ❌ Открыт |
| 2 | **Транзакционная утечка** | Query-handlers используют `this.prismaService.client` вместо `this.db` | При вложенном `repo.transaction()` read-side выполняется вне транзакции → dirty reads. | ❌ Открыт |
| 3 | **Scope-based доступ к курсам** | `find-courses`, `find-course` | Курс `scope=DIVISION` читался сотрудником из другого подразделения. | ✅ Исправлен |
| 4 | **Нет "Forgot password"** | Auth | Сотрудник не мог восстановить доступ без IT-поддержки. | ✅ Исправлен |
| 5 | **`StartStep` не проверял порядок** | `start-step.command-handler` | Сотрудник мог начать любой шаг, не завершив предыдущий. | ✅ Исправлен |
| 6 | **`complete-registration` без токена** | Auth | Любой знающий email мог сбросить чужой пароль. | ✅ Исправлен |
| 7 | **`generate-module-test` возвращал 422** | `generate-module-test.command-handler` | Вопросы создаются без `moduleId`, строгий фильтр давал 0 результатов. Добавлен fallback на все вопросы курса. | ✅ Исправлен |
| 8 | **Повторные попытки теста не ограничены** | `start-test-attempt` | Сотрудник может пересдавать тест бесконечно. | ❌ Открыт |
| 9 | **PromoteEmployee не триггерит уведомления/email** | `promote-employee.command-handler` | Сотрудник и менеджер не получают уведомления о повышении. Также исправлен баг: handler использовал `command.id` (UUID команды) вместо `command.employeeId`. | ✅ Исправлен |
| 10 | **Завершение онбординга не триггерит auto-complete и уведомление** | `complete-onboarding-step.command-handler` | При закрытии последнего шага entity ставит `status=COMPLETED`, handler проверяет это и отправляет уведомления `ONBOARDING_COMPLETED` сотруднику, `ONBOARDING_COMPLETED_MANAGER` менеджеру + email. | ✅ Исправлен |
| 11 | **Одобрение заявки не создаёт enrollment** | `approve-course-application` | Нужно два ручных запроса: approve + create-enrollment. | ❌ Открыт |
| 12 | **`GET /employees/me/subordinates` ломается** | `find-my-subordinates` | Код корректен: `employee.id === user.id` (shared PK), маппинг не нужен. Баг не воспроизводится. | ✅ Закрыт (ложный) |

---

## 3. Что требует доработки

### Архитектура
- **Тесты**: необходим хотя бы базовый набор unit-тестов для domain entities и integration-тестов для ключевых handlers (CreateEnrollment, AssignOnboarding, FinishTestAttempt).
- **Role system**: 1 роль на пользователя, автоматически выводится из позиции. Покрывает текущие требования; для полноценного RBAC потребовалась бы many-to-many.

### API & UX
- **Пагинация**: `list-assigned-by-me`, `list-chat-messages` возвращают всё без лимита — OOM на больших объёмах.
- **Сортировка**: `orderBy` не выставлен на большинстве list-эндпоинтов (дефолт `createdAt desc`).

### Нотификации и почта
- Email покрывает 6 из ~10 событий. Не охвачены: провал/сдача теста, отклонение заявки на курс.

### Файлы
- Принимаются только изображения. Для уроков нужна поддержка видео и PDF.

---

## 4. Потенциальные фичи

| Фича | Приоритет | Статус |
|------|-----------|--------|
| ~~**Сброс пароля**~~ | ~~Высокий~~ | ✅ Реализовано |
| **Авто-enrollment при одобрении заявки** | Высокий | ❌ Открыт — лишний шаг для Admin |
| ~~**Dashboard менеджера**~~ | ~~Высокий~~ | ✅ Реализовано: `GET /api/employees/me/team-dashboard` |
| ~~**Завершение онбординга**: auto-complete + нотификация~~ | ~~Высокий~~ | ✅ Реализовано |
| **Ограничение попыток теста** (max N, cooldown) | Средний | ❌ Открыт |
| ~~**Сертификат за прохождение курса**~~ | ~~Средний~~ | ✅ Реализовано: авто-выдача, `GET /me/certificates`, публичная верификация |
| ~~**Поиск по курсам**~~ | ~~Средний~~ | ✅ Реализовано: `?search=`, `?authorId=` |
| **Прогресс-бар онбординга** в реальном времени (WS) | Средний | ❌ Открыт |
| **Экспорт данных** (CSV/Excel) | Средний | ❌ Открыт |
| **Время на прохождение урока** (time-tracking) | Низкий | ❌ Открыт |
| **Редактирование / удаление сообщений в чате** | Низкий | ❌ Открыт |
| ~~**Уведомление о неактивности** в онбординге~~ | ~~Низкий~~ | ✅ Реализовано: cron ежедневно в 9:00, срабатывает в день дедлайна шага |

---

## 5. Краткий статус по модулям

| Модуль | Статус | Примечания |
|--------|--------|------------|
| Identity (Auth / User / Role / Token) | ✅ Готов | Invite flow, forgot/reset password, 5 позиционных ролей, авто-выдача роли по должности |
| Organization (Dept / Div / Position) | ✅ Готов | — |
| Employee | ✅ Готов | subordinates (flat + tree), team-dashboard, promote с уведомлениями, SubordinateCheckService |
| Files | ✅ Готов | Только изображения |
| Onboarding (Template / Assignment / Chat) | ✅ Готов | Manager создаёт шаблоны; назначение только своим подчинённым; auto-complete + уведомления; inactivity cron |
| Education — Courses / Lessons | ✅ Готов | Статусы DRAFT/PENDING_REVIEW/PUBLISHED/REJECTED; Manager создаёт → DRAFT → submit → Admin publish/reject; scope enforcement |
| Education — Test Definition | ✅ Готов | — |
| Education — Test Attempts | ⚠️ Частично | Нет лимита попыток |
| Education — Enrollments | ✅ Готов | Bulk, Manager только своих подчинённых, порядок шагов, авто-сертификат |
| Education — Certificates | ✅ Готов | Авто-выдача + публичная верификация |
| Education — Course Applications | ⚠️ Частично | Нет авто-enrollment при одобрении |
| Notifications | ⚠️ Частично | 5 из ~10 событий (добавлены: завершение онбординга, повышение, просрочка шага) |
| Mail | ⚠️ Частично | 6 из ~10 событий (добавлены: завершение онбординга, повышение) |
| Tests | ❌ Отсутствуют | Критичный gap |
