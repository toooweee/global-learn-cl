# API CHECKLIST

Реестр HTTP-эндпоинтов `global-learn-api`, сгруппированных по модулям. Для каждого
эндпоинта: метод+путь, требуемая роль (`@Roles`) или `Public`, что возвращает, зачем
нужен и чего может не хватать.

**Глобальные правила:**

- `JwtAuthGuard` + `RolesGuard` зарегистрированы как `APP_GUARD` → **по умолчанию все
  эндпоинты требуют access-token в cookie**. `@Public()` снимает требование.
- `@Roles(...)` ограничивает доступ по роли (`admin`, `department_head`,
  `division_head`, `senior_manager`, `manager`). Без `@Roles` — доступен любому
  аутентифицированному пользователю.
- Списки отдают `PaginatedResponseDto` (`count` / `limit` / `page` / `data`).
- Создание обычно отдаёт `IdResponseDto` (`{ id }`).

Легенда статуса: ✅ готов · ⚠️ есть замечание · ❌ отсутствует, но нужен.

---

## identity / auth — `/auth`

| Метод | Путь | Роль | Возвращает | Назначение | Статус / чего не хватает |
|---|---|---|---|---|---|
| GET | `/auth/me` | auth | `MeResponseDto` | Текущий пользователь (id, email, роль) | ✅ |
| GET | `/auth/me/profile` | auth | `MyProfileResponseDto` | Полный профиль: user+role+employee+division+department+position | ✅ |
| POST | `/auth/register` | admin | `IdResponseDto` | Регистрация сотрудника + письмо-приглашение | ⚠️ дублирует `POST /employees` и `POST /user` — стоит оставить один путь создания аккаунта |
| POST | `/auth/complete-registration` | Public | `void` | Завершение регистрации по токену из письма | ✅ |
| POST | `/auth/forgot-password` | Public | `void` | Запрос письма на сброс пароля | ✅ |
| POST | `/auth/reset-password` | Public | `void` | Сброс пароля по токену | ✅ |
| POST | `/auth/login` | Public | `IdResponseDto` + cookies | Логин, выставляет access/refresh cookies | ✅ |
| POST | `/auth/refresh` | Public | `IdResponseDto` + cookies | Обновление пары токенов по refresh-cookie | ✅ |
| POST | `/auth/logout` | auth | `void` | Инвалидация refresh-токена для устройства | ✅ |
| POST | `/auth/change-password` | auth | `void` | Смена пароля (сбрасывает все сессии) | ✅ |

Замечания по модулю:
- ❌ Нет эндпоинта «список моих сессий / устройств» и «выйти со всех устройств» (логаут только для текущего user-agent).

## identity / user — `/user`

| Метод | Путь | Роль | Возвращает | Назначение | Статус / чего не хватает |
|---|---|---|---|---|---|
| POST | `/user` | auth (нет `@Roles`!) | `IdResponseDto` | Создать пользователя | ⚠️ нет `@Roles('admin')` и нет `@ApiTags` — создание аккаунта открыто любому залогиненному; пересекается с `/auth/register` |
| GET | `/user` | auth | `Paginated<UserResponseDto>` | Список пользователей | ✅ |
| GET | `/user/:id` | auth | `UserResponseDto` | Пользователь по id | ✅ |

Замечания: ❌ нет update/delete пользователя на этом контроллере (управление идёт через `/employees`).

## identity / role — `/roles`

| Метод | Путь | Роль | Возвращает | Назначение | Статус / чего не хватает |
|---|---|---|---|---|---|
| POST | `/roles` | admin | `IdResponseDto` | Создать роль | ✅ |
| GET | `/roles` | auth | `Paginated<RoleResponseDto>` | Список ролей | ✅ |
| GET | `/roles/:id` | auth | `RoleResponseDto` | Роль по id | ✅ |
| DELETE | `/roles/:id` | admin | `void` | Удалить роль | ⚠️ ❌ нет update (переименование) роли |

## employee — `/employees`

| Метод | Путь | Роль | Возвращает | Назначение | Статус / чего не хватает |
|---|---|---|---|---|---|
| POST | `/employees` | admin | `IdResponseDto` | Регистрация сотрудника | ✅ |
| GET | `/employees` | auth | `Paginated<EmployeeResponseDto>` | Список с фильтрами `divisionId`/`departmentId`/`roleId` | ✅ |
| GET | `/employees/me/team-dashboard` | auth | `ManagerDashboardResponseDto` | Дашборд руководителя: все рекурсивные подчинённые + прогресс по курсам/онбордингу | ✅ |
| GET | `/employees/me/subordinates` | auth | `EmployeeResponseDto[]` | Прямые подчинённые (один уровень) | ✅ |
| GET | `/employees/me/subordinates/tree` | auth | `SubordinateTreeNodeDto[]` | Орг-дерево подчинённых по иерархии должностей | ✅ |
| GET | `/employees/:id` | auth | `EmployeeResponseDto` | Сотрудник по id | ✅ |
| PATCH | `/employees/:id` | self или admin | `void` | Обновить профиль | ⚠️ проверка `user.role !== 'Admin'` — роль в JWT хранится как `admin` (нижний регистр), сравнение с `'Admin'` похоже на баг → менеджеры/админы не пройдут эту ветку корректно |
| PATCH | `/employees/:id/promote` | admin | `void` | Повышение (смена должности) | ✅ |
| DELETE | `/employees/:id` | admin | `void` | Увольнение (soft delete) | ✅ |

Замечания: ❌ нет «вернуть уволенного», ❌ нет назначения/снятия ролей сотруднику отдельным эндпоинтом.

## organization / department — `/departments`

| Метод | Путь | Роль | Возвращает | Назначение | Статус |
|---|---|---|---|---|---|
| POST | `/departments` | admin | `IdResponseDto` | Создать департамент | ✅ |
| GET | `/departments` | auth | `Paginated<DepartmentResponseDto>` | Список | ✅ |
| GET | `/departments/:id` | auth | `DepartmentResponseDto` | По id | ✅ |
| PATCH | `/departments/:id` | admin | `void` | Обновить | ✅ |
| DELETE | `/departments/:id` | admin | `void` | Удалить | ✅ |

## organization / division — `/divisions`

| Метод | Путь | Роль | Возвращает | Назначение | Статус |
|---|---|---|---|---|---|
| POST | `/divisions` | admin | `IdResponseDto` | Создать отдел | ✅ |
| GET | `/divisions` | auth | `Paginated<DivisionResponseDto>` | Список (фильтр `departmentId`) | ✅ |
| GET | `/divisions/:id` | auth | `DivisionResponseDto` | По id | ✅ |
| PATCH | `/divisions/:id` | admin | `void` | Обновить | ✅ |
| DELETE | `/divisions/:id` | admin | `void` | Удалить | ✅ |

## organization / position — `/positions`

| Метод | Путь | Роль | Возвращает | Назначение | Статус |
|---|---|---|---|---|---|
| POST | `/positions` | admin | `IdResponseDto` | Создать должность (с `parentId` для иерархии) | ✅ |
| GET | `/positions/tree` | auth | `PositionTreeDto[]` | Дерево иерархии должностей | ✅ |
| GET | `/positions` | auth | `Paginated<PositionResponseDto>` | Список | ✅ |
| GET | `/positions/:id` | auth | `PositionResponseDto` | По id | ✅ |
| PATCH | `/positions/:id` | admin | `void` | Обновить (в т.ч. `parentId`) | ✅ |
| DELETE | `/positions/:id` | admin | `void` | Удалить | ✅ |

## files — `/files`

| Метод | Путь | Роль | Возвращает | Назначение | Статус / чего не хватает |
|---|---|---|---|---|---|
| POST | `/files` | auth | `FileResponseDto` | Загрузка файла (только изображения, ≤5 МБ) в MinIO/S3 | ✅ |
| GET | `/files/:id` | auth | `FileResponseDto` | Presigned-URL файла | ✅ |
| DELETE | `/files/:id` | auth | `void` | Удалить файл | ⚠️ нет `@Roles` — удалить может любой залогиненный |

## education / course — `/courses`

| Метод | Путь | Роль | Возвращает | Назначение | Статус |
|---|---|---|---|---|---|
| POST | `/courses` | admin/dept/div head | `IdResponseDto` | Создать курс (admin → PUBLISHED, менеджер → DRAFT) | ✅ |
| POST | `/courses/full` | admin/dept/div head | `IdResponseDto` | Создать курс с модулями и шагами атомарно | ✅ |
| GET | `/courses` | auth | `Paginated<CourseSummaryResponseDto>` | Список с фильтрами (scope, department, division, visibleToMe, includeArchived) | ✅ |
| GET | `/courses/analytics` | auth | `Paginated<CoursesOverviewItemDto>` | Обзор курсов с completion-rate | ⚠️ нет `@Roles` — аналитика доступна всем |
| GET | `/courses/:id` | auth | `CourseResponseDto` | Курс по id (с модулями/шагами) | ✅ |
| GET | `/courses/:id/analytics` | auth | `CourseAnalyticsResponseDto` | Аналитика курса по divisions/departments | ⚠️ нет `@Roles` |
| PATCH | `/courses/:id` | admin/dept/div head | `void` | Обновить метаданные (менеджер — только свои) | ✅ |
| DELETE | `/courses/:id` | admin | `void` | Удалить курс | ✅ |
| PATCH | `/courses/:id/submit` | admin/dept/div head | `void` | Отправить DRAFT на ревью | ✅ |
| PATCH | `/courses/:id/publish` | admin | `void` | Опубликовать PENDING_REVIEW | ✅ |
| PATCH | `/courses/:id/reject` | admin | `void` | Отклонить с примечанием | ✅ |
| PATCH | `/courses/:id/archive` | admin | `void` | Архивировать | ✅ |
| PATCH | `/courses/:id/unarchive` | admin | `void` | Разархивировать | ✅ |
| POST | `/courses/:id/modules` | admin/dept/div head | `IdResponseDto` | Добавить модуль | ✅ |
| DELETE | `/courses/:id/modules/:moduleId` | admin/dept/div head | `void` | Удалить модуль | ⚠️ ❌ нет переименования модуля и переупорядочивания (reorder) |
| POST | `/courses/:id/modules/:moduleId/steps` | admin/dept/div head | `IdResponseDto` | Добавить шаг | ✅ |
| DELETE | `/courses/:id/modules/:moduleId/steps/:stepId` | admin/dept/div head | `void` | Удалить шаг | ⚠️ ❌ нет редактирования/reorder шага |
| POST | `/courses/:id/generate-test` | admin | `IdResponseDto` | Сгенерировать итоговый тест курса из банка вопросов | ✅ |
| POST | `/courses/:id/modules/:moduleId/generate-test` | admin | `IdResponseDto` | Сгенерировать итоговый тест модуля | ✅ |
| GET | `/courses/:id/modules/:moduleId/questions` | admin | `CourseQuestionResponseDto[]` | Банк вопросов модуля | ✅ |

## education / course-application — `/courses/:id/applications`, `/me/applications`

| Метод | Путь | Роль | Возвращает | Назначение | Статус |
|---|---|---|---|---|---|
| POST | `/courses/:id/applications` | auth | `IdResponseDto` | Подать заявку на курс | ✅ |
| GET | `/courses/:id/applications` | admin | `Paginated<CourseApplicationResponseDto>` | Заявки на курс (фильтр `status`) | ✅ |
| PATCH | `/courses/:id/applications/:appId/approve` | admin | `void` | Одобрить заявку | ✅ |
| PATCH | `/courses/:id/applications/:appId/reject` | admin | `void` | Отклонить заявку | ✅ |
| GET | `/me/applications` | auth | `Paginated<CourseApplicationResponseDto>` | Мои заявки | ✅ |

## education / enrollment — `/courses/:id/enroll`, `/enrollments`, `/me/enrollments`

| Метод | Путь | Роль | Возвращает | Назначение | Статус |
|---|---|---|---|---|---|
| POST | `/courses/:id/enroll` | admin/manager* | `IdResponseDto` | Записать сотрудника на курс | ✅ |
| POST | `/courses/:id/enroll/bulk` | admin/manager* | `BulkEnrollResponseDto` | Массовая запись | ✅ |
| GET | `/courses/:id/enrollments` | admin/manager* | `Paginated<EnrollmentResponseDto>` | Записи на курс | ✅ |
| GET | `/me/enrollments` | auth | `Paginated<EnrollmentSummaryResponseDto>` | Мои записи | ✅ |
| GET | `/enrollments/:id` | auth | `EnrollmentResponseDto` | Запись с прогрессом по шагам | ✅ |
| DELETE | `/enrollments/:id` | auth | `void` | Отменить запись | ⚠️ нет `@Roles` — отменить может любой залогиненный |
| POST | `/enrollments/:id/steps/:stepId/start` | auth | `void` | Отметить шаг начатым | ✅ |
| POST | `/enrollments/:id/steps/:stepId/complete` | auth | `void` | Завершить шаг (авто-завершение записи) | ✅ |

\* `admin`, `department_head`, `division_head`, `senior_manager`.

## education / lesson — `/lessons`

| Метод | Путь | Роль | Возвращает | Назначение | Статус |
|---|---|---|---|---|---|
| POST | `/lessons` | admin/dept/div head | `IdResponseDto` | Создать урок | ✅ |
| GET | `/lessons/:id` | auth | `LessonResponseDto` | Урок по id | ✅ |
| PATCH | `/lessons/:id` | admin/dept/div head | `void` | Обновить | ✅ |
| DELETE | `/lessons/:id` | admin/dept/div head | `void` | Удалить | ⚠️ ❌ нет списка уроков (`GET /lessons`) |

## education / test-definition — `/test-definitions`, `/courses/:id/questions`, `/questions`

| Метод | Путь | Роль | Возвращает | Назначение | Статус |
|---|---|---|---|---|---|
| POST | `/test-definitions` | admin/dept/div head | `IdResponseDto` | Создать тест | ✅ |
| GET | `/test-definitions/:id` | admin/dept/div head | `TestDefinitionResponseDto` | Тест с вопросами | ✅ |
| PATCH | `/test-definitions/:id` | admin/dept/div head | `void` | Обновить name/passingPercent | ✅ |
| DELETE | `/test-definitions/:id` | admin/dept/div head | `void` | Удалить тест | ✅ |
| POST | `/test-definitions/:id/questions` | admin/dept/div head | `void` | Добавить вопрос из банка | ✅ |
| POST | `/test-definitions/:id/questions/bulk` | admin/dept/div head | `void` | Массово добавить вопросы | ✅ |
| POST | `/test-definitions/:id/generate` | admin/dept/div head | `void` | Авто-набор `count` случайных вопросов (заменяет текущие) | ✅ |
| DELETE | `/test-definitions/:id/questions/:questionId` | admin/dept/div head | `void` | Убрать вопрос из теста | ✅ |
| POST | `/courses/:id/questions` | admin/dept/div head | `IdResponseDto` | Создать вопрос (с ответами) в банке курса | ✅ |
| GET | `/courses/:id/questions` | admin/dept/div head | `CourseQuestionResponseDto[]` | Вопросы банка (фильтр `moduleId`) | ✅ |
| GET | `/courses/:id/questions/stats` | admin/dept/div head | `QuestionBankStatsDto` | Статистика банка (всего/в тестах/не использовано/по модулям) | ✅ |
| GET | `/questions/:id` | admin/dept/div head | `CourseQuestionResponseDto` | Вопрос по id | ✅ |
| PATCH | `/questions/:id` | admin/dept/div head | `void` | Обновить вопрос/ответы | ✅ |
| DELETE | `/questions/:id` | admin/dept/div head | `void` | Удалить вопрос (каскад ответов и связей) | ✅ |

> `@Roles('admin','department_head','division_head')` навешен на весь контроллер.

## education / test-attempt — `/tests/:testId/attempts`, `/attempts`

| Метод | Путь | Роль | Возвращает | Назначение | Статус |
|---|---|---|---|---|---|
| POST | `/tests/:testId/attempts` | auth | `IdResponseDto` | Начать/возобновить попытку | ✅ |
| GET | `/tests/:testId/attempts` | auth | `TestAttemptSummaryDto[]` | Мои попытки по тесту | ✅ |
| GET | `/attempts/:id` | auth | `TestAttemptResponseDto` | Статус попытки | ✅ |
| POST | `/attempts/:id/answers` | auth | `void` | Отправить/обновить ответ | ✅ |
| POST | `/attempts/:id/finish` | auth | `TestAttemptResultDto` | Завершить, получить балл (`isPassed = score ≥ test.passingPercent`) | ⚠️ логика верная (берёт `passingPercent`, фолбэк 80), но `@ApiOperation` summary жёстко пишет «≥ 80%» — вводящий в заблуждение текст Swagger |

## education / certificate — `/me/certificates`, `/certificates`

| Метод | Путь | Роль | Возвращает | Назначение | Статус |
|---|---|---|---|---|---|
| GET | `/me/certificates` | auth | `CertificateResponseDto[]` | Мои сертификаты о прохождении | ✅ |
| GET | `/certificates/:id` | Public | `CertificateResponseDto` | Сертификат по id (публично, для верификации) | ✅ |

## onboarding / template — `/onboarding/templates`

| Метод | Путь | Роль | Возвращает | Назначение | Статус |
|---|---|---|---|---|---|
| POST | `/onboarding/templates` | admin/dept/div head | `IdResponseDto` | Создать шаблон онбординга для роли | ✅ |
| GET | `/onboarding/templates` | admin/dept/div head | `Paginated<...SummaryResponseDto>` | Список (фильтр `positionId`/`divisionId`) | ✅ |
| GET | `/onboarding/templates/:id` | admin/dept/div head | `OnboardingTemplateResponseDto` | Шаблон с шагами | ✅ |
| PUT | `/onboarding/templates/:id` | admin/dept/div head | `void` | Полная замена метаданных и шагов | ⚠️ ❌ нет DELETE шаблона |

## onboarding / assignment — `/onboardings`

| Метод | Путь | Роль | Возвращает | Назначение | Статус |
|---|---|---|---|---|---|
| POST | `/onboardings` | auth | `IdResponseDto` | Назначить онбординг из шаблона | ⚠️ нет `@Roles` — назначить может любой залогиненный |
| GET | `/onboardings` | auth | `Paginated<OnboardingResponseDto>` | Список с фильтрами (`assignedToId`/`assignedById`/`status`) | ✅ |
| GET | `/onboardings/mine` | auth | `OnboardingResponseDto[]` | Мои онбординги (как assignee) | ✅ |
| GET | `/onboardings/assigned-by-me` | auth | `OnboardingResponseDto[]` | Назначенные мной (как менеджер) | ✅ |
| GET | `/onboardings/:id` | auth | `OnboardingResponseDto` | Онбординг с шагами | ✅ |
| POST | `/onboardings/:id/complete-step` | auth | `void` | Завершить текущий шаг (selections/feedback) | ✅ |
| POST | `/onboardings/:id/cancel` | auth | `void` | Отменить онбординг | ⚠️ нет `@Roles` |

## onboarding / chat — `/onboardings/:onboardingId/chat/messages`

| Метод | Путь | Роль | Возвращает | Назначение | Статус |
|---|---|---|---|---|---|
| GET | `.../chat/messages` | auth | `ChatMessagesPageResponseDto` | История чата (cursor-based, newest first) | ✅ |
| POST | `.../chat/messages` | auth | `IdResponseDto` | Отправить сообщение (только assigned_by/assigned_to) | ✅ |
| POST | `.../chat/messages/read` | auth | `void` | Отметить чужие сообщения прочитанными | ✅ |

> Реалтайм: WS-namespace `chat`, события `subscribe` / `message:created` (`OnboardingChatGateway`).

## notifications — `/me/notifications`

| Метод | Путь | Роль | Возвращает | Назначение | Статус |
|---|---|---|---|---|---|
| GET | `/me/notifications` | auth | `Paginated<NotificationResponseDto>` | Мои уведомления | ✅ |
| POST | `/me/notifications/:id/read` | auth | `void` | Прочитать уведомление | ✅ |
| POST | `/me/notifications/read-all` | auth | `void` | Прочитать все | ⚠️ ❌ нет эндпоинта счётчика непрочитанных (есть индекс под него в БД); реалтайм — `NotificationsGateway` |

## app — `/`

| Метод | Путь | Роль | Возвращает | Назначение | Статус |
|---|---|---|---|---|---|
| GET | `/` | auth | `'Hello World!'` | Health-заглушка | ⚠️ заглушка, нет `@Public()` → отдаёт 401 без токена; стоит сделать публичный `/health` |

---

## Сквозные замечания

1. **Несогласованный `@Roles`.** На части мутаций защита по роли отсутствует:
   `POST /user`, `DELETE /files/:id`, `DELETE /enrollments/:id`, `POST /onboardings`,
   `POST /onboardings/:id/cancel`, `GET /courses/analytics`. Стоит выровнять политику.
2. **Регистр роли.** В `EmployeeController.update` сравнение `user.role !== 'Admin'`, а в
   JWT роль хранится как `admin` (нижний регистр, см. `roles.constants.ts`) — вероятный баг авторизации.
3. **Три пути создания аккаунта** (`/auth/register`, `/employees`, `/user`) — желательно свести.
4. **Порог прохождения теста** считается корректно (`score ≥ test.passingPercent`, фолбэк 80), но Swagger-summary эндпоинта `finish` жёстко пишет «passed if ≥ 80%» — текст стоит поправить.
5. **CRUD-пробелы:** нет update роли; нет reorder/edit модулей и шагов курса; нет `GET /lessons`
   (список); нет DELETE шаблона онбординга; нет счётчика непрочитанных уведомлений.
6. **Swagger:** у `UserController` нет `@ApiTags` — выпадает из группировки в `/api/docs`.

---

# Функционал, описанный в `docs/first.md`, но фактически отсутствующий

Сверка текста диплома (`docs/first.md`) с реализацией. Здесь — только то, что **заявлено
в дипломе, но в коде отсутствует или реализовано иначе**. Большая часть ТЗ (роли из
должности, приглашения по e-mail, модерация курсов, заявки/зачисление, авто-сертификат
по завершении, шаблоны и назначение онбординга, чат по WebSocket, дашборды, cron-контроль
просрочек, письма по событиям) **подтверждена в коде** — ниже перечислены именно пробелы.

| # | Заявлено в дипломе (где) | Факт в коде | Вывод |
|---|---|---|---|
| 1 | **Кэширование в Redis** часто запрашиваемых данных (курсы, модули, прогресс) со снижением отклика 250–300 → 80–120 мс. Раздел 4.3 «Рефакторинг работы с данными (кэширование)», табл. 39; п. 4.2.2 (стр. 1094); табл. 37 (стр. 895) | Redis **нигде не используется**: `REDIS_IP`/`REDIS_PORT` объявлены в `EnvSchema`, но не читаются ни одним модулем; нет `cache-manager`/`ioredis`/`CacheModule`/`CacheInterceptor`. Все запросы идут напрямую в PostgreSQL | ❌ **Отсутствует.** Кэширования нет вообще |
| 2 | **Redis как хранилище фоновых задач / очередь** (стр. 249, 895, 1094: «резидентное хранилище Redis для кэширования и фоновой обработки задач») | Фоновые задачи — только cron `@nestjs/schedule` (`OnboardingInactivityService`, ежедневно в 9:00). Очереди задач в Redis (Bull и т.п.) нет | ❌ **Отсутствует** как Redis-механизм (cron-планировщик есть, но это не Redis) |
| 3 | **PDF-файл сертификата.** Табл. 24, поле `file_id UUID FK NULL — Файл сертификата (PDF)`; «цифровой сертификат» (стр. 266, 287) | Модель `CourseCertificate` (`prisma/schema.prisma`) **не имеет поля `file_id`**; генерации PDF нет. Сертификат — запись в БД + JSON в ответе. Публичная верификация по id есть (`GET /certificates/:id`), но файла-документа нет | ⚠️ **Частично:** запись и верификация есть, PDF-артефакт отсутствует |
| 4 | **Аудит системных журналов / мониторинг активности пользователей** для администратора (стр. 299 «мониторинг активности пользователей … журналы»; стр. 332 «аудит системных журналов»; стр. 426 «администратор … журналы — по запросу») | Нет ни таблицы журналов аудита, ни эндпоинтов. Поиск по `audit/journal/activity-log` пуст. Логи только технические (`AppLogger` в консоль) | ❌ **Отсутствует** как функция аудита/журналов в системе |
| 5 | **Видеоматериалы в уроках.** Табл. 12 (стр. 561): на `files` ссылаются «lessons (видео)»; в схеме `lessons.video_id → files` | Связь `lessons.video_id` в схеме есть, **но загрузка файлов ограничена изображениями ≤ 5 МБ** (`FileController`: `ALLOWED_MIMES = jpeg/png/webp/gif`). Залить видео невозможно — функция не доведена | ⚠️ **Частично/не работает:** поле в БД есть, загрузка видео не поддержана |

## Сводно

- **Главный расхождение для защиты — Redis (пп. 1–2):** диплом отводит кэшированию отдельный
  подраздел рефакторинга с конкретными цифрами (табл. 39), но в коде Redis не подключён.
  Варианты: либо реально внедрить `CacheModule` + `ioredis` (минимум — кэш чтения курсов/оргструктуры),
  либо убрать/смягчить заявления о кэшировании и Redis-очередях в тексте.
- **PDF-сертификат (п. 3)** и **аудит-журналы (п. 4)** — заявлены, но как артефакта/раздела их нет.
  Привести текст в соответствие либо добавить минимальную реализацию (генерация PDF по шаблону;
  таблица + эндпоинт журнала действий администратора).
- **Видео-уроки (п. 5)** — снять ограничение MIME/размера в `FileController` под видео либо
  не упоминать видео для уроков.
- Остальные функции из ТЗ (разделы 2, 3.1.1) **в коде присутствуют** — см. таблицы эндпоинтов выше.
