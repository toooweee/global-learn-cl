# DIAGRAMS — GlobalLearn API

> Описания для диаграмм UML. Используются при оформлении дипломной работы.

---

## 1. Диаграмма прецедентов (Use Case Diagram)

### Акторы и обобщение

```
manager
  ↑ (обобщение)
senior_manager
  ↑
division_head
  ↑
department_head

admin  — отдельный актор, без обобщения
```

---

### Актор: `manager` (Менеджер — базовый сотрудник)

> Нижний уровень. Все остальные роли наследуют эти прецеденты через обобщение.

**Подсистема: Аутентификация**
- Войти в систему
- Выйти из системы
- Сменить пароль
- Восстановить пароль

**Подсистема: Курсы**
- Просмотреть каталог курсов
- Подать заявку на курс
- Начать шаг курса
- Завершить шаг курса
- Пройти тест
- Просмотреть свои записи на курсы
- Получить сертификат

**Подсистема: Онбординг**
- Просмотреть свой онбординг
- Завершить шаг онбординга
- Отправить сообщение в чат онбординга
- Просмотреть историю чата

**Подсистема: Профиль**
- Просмотреть свой профиль
- Просмотреть уведомления
- Отметить уведомления прочитанными

---

### Актор: `senior_manager` (Старший менеджер)

> Наследует всё от `manager`. Добавляет управление подчинёнными.

**Подсистема: Сотрудники**
- Просмотреть дерево подчинённых

**Подсистема: Курсы — назначение**
- Записать подчинённого на курс
- Массово записать подчинённых на курс
- Просмотреть записи подчинённых на курс

**Подсистема: Онбординг — назначение**
- Назначить онбординг подчинённому
- Просмотреть назначенные мной онбординги

---

### Актор: `division_head` (Руководитель отдела)

> Наследует всё от `senior_manager`. Добавляет создание учебного контента.

**Подсистема: Курсы — создание**
- Создать курс (статус DRAFT)
- Создать курс с модулями и шагами
- Редактировать курс
- Добавить / удалить модуль
- Добавить / удалить шаг в модуле
- Отправить курс на проверку администратору

**Подсистема: Уроки и тесты**
- Создать и редактировать урок
- Создать тест и добавить вопросы
- Управлять банком вопросов курса

**Подсистема: Онбординг — шаблоны**
- Создать шаблон онбординга
- Редактировать шаблон онбординга

**Подсистема: Аналитика**
- Просмотреть дашборд прогресса подчинённых
- Просмотреть аналитику по курсу в разрезе отдела

---

### Актор: `department_head` (Руководитель департамента)

> Наследует всё от `division_head`. Отдельных новых прецедентов нет — область охвата распространяется на весь департамент. В диаграмме достаточно стрелки обобщения от `division_head`.

---

### Актор: `admin` (Администратор)

> Отдельный системный актор. Не наследует и не наследуется.

**Подсистема: Управление пользователями**
- Зарегистрировать сотрудника (invite)
- Обновить профиль сотрудника
- Уволить сотрудника
- Повысить сотрудника
- Управлять ролями

**Подсистема: Организационная структура**
- Управлять департаментами
- Управлять отделами
- Управлять иерархией должностей

**Подсистема: Модерация курсов**
- Просмотреть все курсы (все статусы)
- Опубликовать курс
- Отклонить курс с комментарием
- Архивировать / разархивировать курс
- Удалить курс
- Одобрить / отклонить заявку на курс
- Генерировать итоговый тест из банка вопросов

**Подсистема: Онбординг**
- Просмотреть все онбординги
- Отменить онбординг

**Подсистема: Аналитика**
- Просмотреть сводную аналитику по всем курсам
- Просмотреть аналитику по конкретному курсу в разрезе департаментов

---

## 2. Диаграмма классов (Class Diagram)

### Базовая инфраструктура (libs/ddd)

```
Entity<Props>
─────────────────────────────
# id: string
# props: Props
# createdAt: Date
# updatedAt: Date
─────────────────────────────
+ getProps(): Readonly<Props>
+ static create(props): Entity       ← генерирует id, штампует createdAt
+ static recreate({id, props}): Entity  ← гидратация из БД
```

```
Mapper<Domain, DbRecord, ResponseDto>
─────────────────────────────
+ toDomain(record: DbRecord): Domain
+ toPersistence(entity: Domain): DbRecord
+ toResponse(entity: Domain): ResponseDto
```

---

### Модуль Identity

```
User  extends Entity<UserProps>
─────────────────────────────
props:
  email: string
  hashedPassword: string
  roleId: string
  passwordResetToken?: string
  passwordResetExpiresAt?: Date
─────────────────────────────
+ changePassword(newHash): void
+ setPasswordResetToken(hash, expiresAt): void
+ clearPasswordResetToken(): void
```

```
Role
─────────────────────────────
id: string
name: AppRole   ← 'admin' | 'department_head' | 'division_head'
                   | 'senior_manager' | 'manager'
```

```
Token  extends Entity<TokenProps>
─────────────────────────────
props:
  userId: string
  hashedToken: string
  expiresAt: Date
```

Связи:
- `User` →(roleId)→ `Role`  (many-to-one)
- `Token` →(userId)→ `User`  (many-to-one)

---

### Модуль Organization

```
Department  extends Entity<...>
─────────────────────────────
props: name: string

Division  extends Entity<...>
─────────────────────────────
props:
  name: string
  departmentId: string

Position  extends Entity<...>
─────────────────────────────
props:
  name: string
  parentId?: string      ← иерархия должностей
```

Связи:
- `Division` →(departmentId)→ `Department`
- `Position` →(parentId)→ `Position` (self-referential, дерево)

---

### Модуль Employee

```
Employee  extends Entity<EmployeeProps>
─────────────────────────────
props:
  fullname?: string
  divisionId: string
  positionId?: string
  employmentDate: Date
  dismissedAt?: Date
  avatarId?: string
  biography?: string
─────────────────────────────
+ promote(newPositionId): Employee
+ dismiss(): Employee
```

Связи:
- `Employee.id` = `User.id`  (shared PK, 1:1)
- `Employee` →(divisionId)→ `Division`
- `Employee` →(positionId)→ `Position`

Сервисы:
```
SubordinateCheckService
─────────────────────────────
+ isSubordinate(managerId, employeeId): Promise<boolean>
  ← BFS по дереву Position; используется в enrollment и onboarding
```

---

### Модуль Education — Courses

```
Course  extends Entity<CourseProps>
─────────────────────────────
props:
  name: string
  description: string
  authorId: string
  scope: 'ALL' | 'DEPARTMENT' | 'DIVISION'
  departmentId?: string
  divisionId?: string
  coverId?: string
  isArchived: boolean
  status: CourseStatus
  reviewNote?: string
  modules: CourseModule[]
─────────────────────────────
+ addModule(name): void
+ removeModule(moduleId): void
+ addStep(moduleId, step): void
+ removeStep(moduleId, stepId): void
+ archive() / unarchive(): void
+ submitForReview(): void     ← DRAFT → PENDING_REVIEW
+ publish(): void              ← PENDING_REVIEW → PUBLISHED
+ reject(note?): void          ← PENDING_REVIEW → REJECTED
```

```
CourseStatus (enum)
─────────────────────────────
DRAFT | PENDING_REVIEW | PUBLISHED | REJECTED
```

```
CourseModule (value object внутри Course)
─────────────────────────────
id, name, position, steps: CourseStep[]
```

```
CourseStep (value object)
─────────────────────────────
id, name, position
type: 'LESSON' | 'TEST'
lessonId?, testId?
```

---

### Модуль Education — Enrollment

```
Enrollment  extends Entity<EnrollmentProps>
─────────────────────────────
props:
  courseId: string
  employeeId: string
  assignedById: string
  status: 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  startedAt: Date
  completedAt?: Date
  progress: StepProgress[]
─────────────────────────────
+ startStep(stepId): void
+ completeStep(stepId): void    ← если последний — status=COMPLETED
+ cancel(): void
```

```
StepProgress (value object)
─────────────────────────────
stepId, startedAt, completedAt?
```

```
Certificate
─────────────────────────────
id, enrollmentId, employeeId
courseId, issuedAt: Date
```

Связи:
- `Enrollment` →(courseId)→ `Course`
- `Enrollment` →(employeeId)→ `Employee`
- `Certificate` →(enrollmentId)→ `Enrollment`  (1:1)

---

### Модуль Education — TestAttempt

```
TestAttempt  extends Entity<TestAttemptProps>
─────────────────────────────
props:
  testId: string
  employeeId: string
  enrollmentId?: string
  answers: TestAttemptAnswer[]
  score?: number
  isPassed?: boolean
  startedAt: Date
  endedAt?: Date
─────────────────────────────
+ answerQuestion(questionId, answerId, option): void
+ finish(passingPercent): void   ← считает score, isPassed
```

---

### Модуль Onboarding — Template

```
OnboardingTemplate  extends Entity<...>
─────────────────────────────
props:
  name, description
  positionId?, divisionId?
  coverId?
  steps: OnboardingTemplateStep[]
─────────────────────────────
+ updateSteps(steps): void
```

```
OnboardingTemplateStep (value object)
─────────────────────────────
id, name, description, position
type: 'TEXT' | 'COURSE'
courseId?, recommendedStartOffsetDays, recommendedEndOffsetDays
feedbackOptions: { label }[]
```

---

### Модуль Onboarding — Assignment

```
Onboarding  extends Entity<OnboardingProps>
─────────────────────────────
props:
  templateId?: string
  assignedById: string
  assignedToId: string
  status: 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  startDate, endDate: Date
  completedAt?: Date
  steps: OnboardingStep[]
─────────────────────────────
+ completeCurrentStep(stepId, feedbackText?, selectionIds[]): void
  ← проверяет порядок, требует feedback, авто-завершает если последний
+ cancel(): void
```

```
OnboardingStep (value object)
─────────────────────────────
id, name, position, type, courseId?
recommendedStartDate, recommendedEndDate: Date
completedAt?, feedbackText?
feedbackOptions[], feedbackSelections[]
```

Связи:
- `Onboarding` →(templateId)→ `OnboardingTemplate`
- `Onboarding` →(assignedToId)→ `Employee`
- `OnboardingChat` →(onboardingId)→ `Onboarding`  (1:1)

---

## 3. Диаграмма деятельности (Activity Diagram) по ролям

> Отдельная диаграмма для каждого ключевого бизнес-процесса. Ниже — описание дорожек (swimlanes) и шагов.

---

### 3.1 Жизненный цикл курса

**Дорожки:** `division_head / department_head` | `admin` | `Система`

```
[division_head]
  → Создать курс                    (статус: DRAFT)
  → Добавить модули, уроки, тесты
  → Отправить на проверку           (статус: PENDING_REVIEW)

[admin]
  → Получить уведомление о новом курсе на проверке
  → Просмотреть курс
  → [решение]
      ├─ Опубликовать  → [Система] статус: PUBLISHED
      │                → [Система] уведомить автора
      └─ Отклонить     → [Система] статус: REJECTED + reviewNote
                       → [Система] уведомить автора

[division_head] (если REJECTED)
  → Исправить курс
  → Повторно отправить на проверку
```

---

### 3.2 Запись сотрудника на курс и прохождение

**Дорожки:** `senior_manager / division_head` | `manager (сотрудник)` | `Система`

```
[senior_manager]
  → Выбрать курс из каталога
  → Выбрать подчинённого
  → [Система] проверить: является ли subordinate → если нет: 403
  → [Система] создать enrollment (статус: IN_PROGRESS)
  → [Система] отправить уведомление сотруднику

[manager]
  → Открыть курс
  → Начать шаг 1
  → [Система] проверить порядок шагов
  → Завершить шаг
  → ... повторить для каждого шага
  → [Система] если последний шаг завершён:
       → enrollment: COMPLETED
       → выдать сертификат
       → уведомить сотрудника
```

---

### 3.3 Назначение и прохождение онбординга

**Дорожки:** `division_head` | `manager (новый сотрудник)` | `Система`

```
[division_head]
  → Создать шаблон онбординга (шаги, offset-даты, feedback-опции)
  → Выбрать сотрудника для онбординга
  → [Система] проверить: subordinate → если нет: 403
  → [Система] создать snapshot онбординга
       (offset-даты → конкретные даты)
       (создать чат)
  → [Система] отправить email + уведомление сотруднику

[manager]
  → Открыть свой онбординг
  → Завершить шаг 1:
       → выбрать feedback-опции (или написать текст)
  → [Система] проверить: есть ли feedback → если нет: ошибка
  → [Система] отметить шаг завершённым
  → ... повторить для каждого шага
  → [Система] если последний шаг:
       → onboarding: COMPLETED
       → уведомить сотрудника + руководителя + email

[Система — Cron, 9:00 ежедневно]
  → Найти шаги с истёкшим recommendedEndDate, не завершённые
  → Уведомить сотрудника: ONBOARDING_STEP_OVERDUE
  → Уведомить руководителя: ONBOARDING_STEP_OVERDUE_MANAGER
```

---

### 3.4 Регистрация и первый вход сотрудника

**Дорожки:** `admin` | `Система` | `manager (новый сотрудник)`

```
[admin]
  → POST /employees: email, fullname, divisionId, positionId

[Система]
  → Определить роль по positionId (roleFromPositionName)
  → Создать User с временным паролем
  → Создать Employee
  → Сгенерировать invite-токен (TTL 7 дней)
  → Отправить email со ссылкой

[manager]
  → Открыть ссылку из письма
  → POST /auth/complete-registration: token + новый пароль
  → [Система] проверить токен (валидность, срок)
  → [Система] установить пароль, инвалидировать токен
  → Войти в систему
```

---

### 3.5 Повышение сотрудника

**Дорожки:** `admin` | `Система` | `сотрудник`

```
[admin]
  → PATCH /employees/:id/promote: новый positionId

[Система]
  → Обновить Employee.positionId
  → Определить новую роль: roleFromPositionName(position.name)
  → Обновить User.roleId
  → Отправить уведомление сотруднику: EMPLOYEE_PROMOTED
  → Отправить email с именем новой должности

[сотрудник]
  → Получить уведомление
  → При следующем запросе: JWT содержит старую роль
  → Выполнить refresh token → новый access token с новой ролью
```

> Важно: роль в JWT обновляется только при рефреше токена, не мгновенно.
