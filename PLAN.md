# PLAN — выравнивание кода под диплом (`docs/first.md`)

Рабочий файл для меня (Claude) между сессиями. Кратко. Детали пробелов — в `CHECKLIST.md`
(раздел «Функционал, описанный в docs/first.md, но фактически отсутствующий»).
Контекст архитектуры — `CLAUDE.md`. Каталог эндпоинтов — `CHECKLIST.md` (верх).

## Цель
Привести реализацию в соответствие с заявленным в дипломе: закрыть 5 пробелов + мелкие баги,
**либо** там, где решено не кодить — смягчить текст диплома. Каждый пункт довести до ✅.

## Статусы (две независимые оси)
**Прогресс** — бокс в начале строки:
`[ ]` todo · `[~]` в работе · `[x]` готово · `[?]` блокирован (жду решения/ввода) · `[-]` снято (делаем не кодом)
**Решение** по P1–P5 — отдельное поле `Реш:` (что вообще делаем с пунктом):
`CODE` внедряем в код · `DOC` смягчаем текст диплома · `?` ещё не выбрано
> Связь осей: `Реш: DOC` ⇒ код-подзадачи помечаем `[-]`, а правку `docs/first.md` ведём как обычную `[ ]→[x]`.

## Конвенции (чтоб не перечитывать CLAUDE.md)
- Слайс: `domain/ application/(commands|queries) infra/ presentation/`. Хэндлер = `@CommandHandler/@QueryHandler`, контроллер дёргает `CommandBus/QueryBus`.
- Новый модуль → импортировать в `src/modules/app/app.module.ts`. CQRS глобальный.
- Env → только через `EnvService`/`EnvSchema` (`src/infra/env/env.ts`), не `process.env`.
- Репозиторий читает через `this.db` (tx-aware). DbRecord типизировать из `@generated/client`.
- Роли: `@Roles('admin'|'department_head'|'division_head'|'senior_manager'|'manager')`, slug в нижнем регистре (`src/libs/auth/roles.constants.ts`). `@Public()` снимает auth.
- После изменений: `pnpm lint && pnpm build && pnpm test`. Миграции: `pnpm prisma migrate dev --name <...>`.

---

> **РЕШЕНИЕ (2026-06-15): «максимум CODE».** P1/P3/P4/P5 — кодим. P2 (очередь) — DOC
> (в опции «максимум CODE» очередь не входила; cron остаётся, текст диплома смягчаем).
> Мелкие баги/@Roles — кодим. Порядок: сначала добить Трек 1 (клиент), затем этот трек с P1.

## P1 — Redis-кэширование  `[x]`  · Реш: CODE  ⟵ главный пункт для защиты
Диплом: разд. 4.3 + табл.39 (250–300→80–120 мс). Сейчас Redis не подключён (env есть, не читается).
- [x] Deps: `cache-manager` + `@nestjs/cache-manager` + `@keyv/redis` (поставил пользователь).
- [x] `src/infra/cache/cache.module.ts` — глобальный `CacheModule.registerAsync` на `REDIS_IP/REDIS_PORT` из `EnvService`; `CacheService`-обёртка (namespace-версионирование). Импорт в `AppModule`.
- [x] Кэшировать чтения (TTL 60с): `FindCoursesQuery`/`FindCourseQuery` (ключ per-user — встроен enrollment + scope), оргструктура departments/divisions/positions list + position-tree (глобальные ключи).
- [x] Инвалидация в репозиториях (единая точка): `CoursePrismaRepository.save/delete` → bump `courses`; division/department/position repo `save/delete` → bump `org`.
- [~] Проверка: юнит-тест `CacheService` (hit/miss/invalidate/изоляция ns) ✅ + `pnpm build`/`test` зелёные. Живой SQL-лог не прогнан — Redis в docker не проброшен на хост; проверить на `make dev`.
- Реш: CODE (внедрено).

## P2 — Redis как фоновые задачи/очередь  `[ ]`  · Реш: DOC
Диплом стр.249/895/1094. Сейчас фон = cron `@nestjs/schedule` (`OnboardingInactivityService`).
- DOC (рек., дёшево): переформулировать «фоновая обработка задач» → «планировщик cron»; Redis оставить только как кэш (см. P1).
- CODE: внедрить BullMQ-очередь (нотификации/письма async). Дорого, не обязательно.

## P3 — PDF-сертификат  `[ ]`  · Реш: CODE
Диплом табл.24 поле `file_id (PDF)`. Сейчас `CourseCertificate` без `file_id`, PDF нет. Верификация по id есть.
- [ ] Миграция: добавить `file_id UUID NULL FK→files (SET NULL)` в `course_certificates` (+ relation в schema).
- [ ] Генерация PDF при выдаче (в `complete-step.command-handler.ts`, где создаётся сертификат) или ленивая по запросу. Либ: `pdfkit`/`@react-pdf` — выбрать лёгкую.
- [ ] Залить PDF в MinIO (`FileStoragePort`), записать `file_id`. Отдавать presigned-URL в `CertificateResponseDto`.
- Реш: ? · CODE = миграция+генерация PDF · DOC = убрать строку `file_id (PDF)` из табл.24, оставить «запись + верификация по id»

## P4 — Аудит/журнал действий администратора  `[ ]`  · Реш: CODE
Диплом стр.299/332/426. Сейчас нет таблицы/эндпоинтов; логи только в консоль.
- [ ] Миграция: таблица `audit_logs` (id, user_id, action, entity, entity_id, payload jsonb, created_at; индекс по user_id/created_at).
- [ ] Писать аудит: либо глобальный интерсептор на мутации, либо точечно в ключевых хэндлерах (создание/удаление оргструктуры, модерация курса, назначения).
- [ ] `GET /admin/audit` (`@Roles('admin')`, пагинация, фильтры) → `Paginated<AuditLogResponseDto>`.
- Реш: ? · CODE = таблица+запись+эндпоинт · DOC = «аудит» = технические логи (`AppLogger`), убрать журналы как функцию

## P5 — Видео в уроках  `[ ]`  · Реш: CODE
Схема: `lessons.video_id → files` есть; но `FileController` принимает только изображения ≤5МБ.
- CODE: ветка загрузки видео — расширить MIME (`video/mp4`...), поднять лимит; прокинуть `videoId` в lesson create/update DTO + хэндлеры.
- DOC: убрать «видео» из табл.12 диплома, уроки = только markdown `content`.

---

## Мелкие баги/несоответствия (быстрые, чинить кодом)  `[ ]`
- [ ] Role-case баг: `EmployeeController.update` сравнивает `user.role !== 'Admin'` → должно `'admin'`. (`src/modules/employee/presentation/employee.controller.ts`)
- [ ] Недостающие `@Roles` на мутациях: `POST /user`, `DELETE /files/:id`, `DELETE /enrollments/:id`, `POST /onboardings`, `POST /onboardings/:id/cancel`, `GET /courses/analytics`. Решить политику и проставить.
- [ ] `GET /` health: добавить `@Public()` или отдельный публичный `/health`.
- [ ] `UserController`: добавить `@ApiTags('users')`.
- [ ] `finish` test-attempt: поправить `@ApiOperation` summary («≥80%» → «≥ passingPercent»).
- [ ] (опц.) свести 3 пути создания аккаунта (`/auth/register`, `/employees`, `/user`).

## Порядок работы
1. Проставить `Реш: CODE|DOC` по P1–P5 (спросить пользователя, если не очевидно).
2. P1 (Redis-кэш) — главный, делать первым. Затем P3, P4, P5, мелкие баги. P2 — обычно `DOC`.
3. Каждый пункт: код → `pnpm lint && build && test` → отметить `[x]` здесь → при необходимости синхронизировать `CHECKLIST.md`/`CLAUDE.md`.
4. После всех code-пунктов — пройтись по `docs/first.md` и поправить оставшиеся `[D]`.

## Журнал прогресса
<!-- дата — что сделано, односторочно -->
- 2026-06-15 — P1 (Redis-кэш) сделан на ветке `feat/redis-cache`. `AppCacheModule` (@keyv/redis,
  TTL 60с) + `CacheService` (namespace-версионирование для групповой инвалидации). Кэш: курсы
  list+card (per-user ключ), оргструктура list+tree (глобальный). Инвалидация в репозиториях
  (course → ns `courses`; division/department/position → ns `org`). Юнит-тест кэша + полный
  `pnpm test` (50/50) + `pnpm build` зелёные. Живой замер SQL — на `make dev` (Redis в docker не
  проброшен на хост). Дальше: P3 (PDF-сертификат), P4 (аудит), P5 (видео), мелкие баги/@Roles.
</content>
