import 'dotenv/config';
import { PrismaClient } from '@generated/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as argon from 'argon2';
import { randomUUID } from 'node:crypto';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const DEFAULT_PASSWORD = process.env.SEED_PASSWORD ?? 'Test1234!';

const companyStructure = [
  {
    department: 'Административный департамент',
    divisions: [
      'Аналитический отдел',
      'Секретариат',
      'Финансовый отдел',
      'Хозяйственный отдел',
    ],
  },
  {
    department: 'Департамент маркетинга',
    divisions: ['ИТ-отдел', 'Отдел маркетинга', 'Отдел разработки'],
  },
  {
    department: 'Департамент мониторинга',
    divisions: [
      'Отдел развития и обучения',
      'Отдел молокоперерабатывающей промышленности',
      'Отдел мясной промышленности',
      'Отдел сетевого ретейла',
    ],
  },
  {
    department: 'Департамент продаж',
    divisions: [
      'Отдел обеспечения продаж',
      'Отдел продаж',
      'Отдел сервиса и обслуживания',
    ],
  },
];

// Compact, idempotent course creator: one "Материалы курса" module with all
// lessons as steps, plus a "Проверка знаний" module with a single test that
// pulls in every question. Skips creation if a course with the same name
// already exists.
async function seedCourse(opts: {
  name: string;
  description: string;
  scope: 'ALL' | 'DEPARTMENT' | 'DIVISION';
  authorId: string;
  departmentId?: string;
  divisionId?: string;
  passingPercent?: number;
  lessons: { name: string; content: string }[];
  questions: {
    question: string;
    answers: { answer: string; isCorrect: boolean }[];
  }[];
}): Promise<void> {
  const existing = await prisma.course.findFirst({
    where: { name: opts.name },
  });
  if (existing) {
    console.log(`○ Course already exists: ${opts.name}`);
    return;
  }

  const lessons = await Promise.all(
    opts.lessons.map((l) =>
      prisma.lesson.create({
        data: { name: l.name, content: l.content },
      }),
    ),
  );

  const test = await prisma.test.create({
    data: {
      name: `Тест: ${opts.name}`,
      passingPercent: opts.passingPercent ?? 70,
    },
  });

  const course = await prisma.course.create({
    data: {
      name: opts.name,
      description: opts.description,
      scope: opts.scope,
      departmentId: opts.departmentId ?? null,
      divisionId: opts.divisionId ?? null,
      authorId: opts.authorId,
      modules: {
        create: [
          {
            name: 'Материалы курса',
            position: 1,
            steps: {
              create: lessons.map((lesson, i) => ({
                name: opts.lessons[i].name,
                position: i + 1,
                type: 'LESSON' as const,
                lessonId: lesson.id,
              })),
            },
          },
          {
            name: 'Проверка знаний',
            position: 2,
            steps: {
              create: [
                {
                  name: 'Итоговый тест',
                  position: 1,
                  type: 'TEST' as const,
                  testId: test.id,
                },
              ],
            },
          },
        ],
      },
    },
  });

  const createdQuestions = await Promise.all(
    opts.questions.map((q) =>
      prisma.courseQuestion.create({
        data: {
          courseId: course.id,
          question: q.question,
          answers: { create: q.answers },
        },
      }),
    ),
  );

  await prisma.testQuestion.createMany({
    data: createdQuestions.map((q) => ({ testId: test.id, questionId: q.id })),
  });

  console.log(
    `✓ Course: ${opts.name} (${opts.lessons.length} уроков, ${opts.questions.length} вопросов)`,
  );
}

async function main() {
  // ── Roles ─────────────────────────────────────────────────────────────────
  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {},
    create: { name: 'admin' },
  });
  const deptHeadRole = await prisma.role.upsert({
    where: { name: 'department_head' },
    update: {},
    create: { name: 'department_head' },
  });
  const divHeadRole = await prisma.role.upsert({
    where: { name: 'division_head' },
    update: {},
    create: { name: 'division_head' },
  });
  const seniorManagerRole = await prisma.role.upsert({
    where: { name: 'senior_manager' },
    update: {},
    create: { name: 'senior_manager' },
  });
  const managerRole = await prisma.role.upsert({
    where: { name: 'manager' },
    update: {},
    create: { name: 'manager' },
  });
  console.log(
    '✓ Roles: admin, department_head, division_head, senior_manager, manager',
  );

  // ── Positions (иерархия: корень = наивысшая должность) ───────────────────
  // parentId = "должность уровнем выше". childrenOf[X] = подчинённые должности.
  // Корень: Руководитель Департамента (нет родителя)
  // Лист:   Менеджер
  const posDeptHead = await prisma.position.upsert({
    where: { name: 'Руководитель Департамента' },
    update: { parentId: null },
    create: { name: 'Руководитель Департамента' },
  });
  const posDivisionHead = await prisma.position.upsert({
    where: { name: 'Руководитель отдела' },
    update: { parentId: posDeptHead.id },
    create: { name: 'Руководитель отдела', parentId: posDeptHead.id },
  });
  const posSeniorManager = await prisma.position.upsert({
    where: { name: 'Старший Менеджер' },
    update: { parentId: posDivisionHead.id },
    create: { name: 'Старший Менеджер', parentId: posDivisionHead.id },
  });
  const posManager = await prisma.position.upsert({
    where: { name: 'Менеджер' },
    update: { parentId: posSeniorManager.id },
    create: { name: 'Менеджер', parentId: posSeniorManager.id },
  });
  console.log(
    '✓ Positions: Руководитель Департамента → Руководитель отдела → Старший Менеджер → Менеджер',
  );

  // ── Departments + Divisions ────────────────────────────────────────────────
  const divisionIds: Record<string, string> = {};
  const departmentIds: Record<string, string> = {};

  for (const item of companyStructure) {
    const dept = await prisma.department.upsert({
      where: { name: item.department },
      update: {},
      create: { name: item.department },
    });
    departmentIds[item.department] = dept.id;

    for (const divisionName of item.divisions) {
      const division = await prisma.division.upsert({
        where: { name: divisionName },
        update: {},
        create: { name: divisionName, departmentId: dept.id },
      });
      divisionIds[divisionName] = division.id;
    }
  }
  console.log('✓ Departments and divisions');

  // ── Admin user ─────────────────────────────────────────────────────────────
  const adminEmail = process.env.TEST_ADMIN_EMAIL!;
  const hashedAdminPassword = await argon.hash(
    process.env.TEST_ADMIN_PASSWORD!,
  );

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });
  let adminEmployeeId: string;

  if (!existingAdmin) {
    adminEmployeeId = randomUUID();
    await prisma.user.create({
      data: {
        id: adminEmployeeId,
        email: adminEmail,
        hashedPassword: hashedAdminPassword,
        roleId: adminRole.id,
        employee: {
          create: {
            fullname: 'Администратор Системы',
            biography: 'Главный администратор платформы Global Learn',
            employmentDate: new Date('2022-01-10'),
            divisionId: divisionIds['ИТ-отдел'],
            positionId: posDeptHead.id,
          },
        },
      },
    });
    console.log('✓ Admin user created');
  } else {
    adminEmployeeId = existingAdmin.id;
    console.log('○ Admin user already exists');
  }

  // ── Employees ──────────────────────────────────────────────────────────────
  const hashedDefaultPassword = await argon.hash(DEFAULT_PASSWORD);

  const employeeProfiles = [
    {
      email: 'ivanov@global-learn.ru',
      fullname: 'Иванов Александр Петрович',
      biography: 'Руководит командой разработки и инфраструктуры',
      division: 'ИТ-отдел',
      positionId: posDivisionHead.id,
      employmentDate: new Date('2022-03-15'),
    },
    {
      email: 'petrova@global-learn.ru',
      fullname: 'Петрова Мария Сергеевна',
      biography: 'Отвечает за архитектуру и code review',
      division: 'Отдел разработки',
      positionId: posSeniorManager.id,
      employmentDate: new Date('2022-07-01'),
    },
    {
      email: 'sidorov@global-learn.ru',
      fullname: 'Сидоров Дмитрий Николаевич',
      biography: 'Руководитель отдела продаж, отвечает за выполнение плана',
      division: 'Отдел продаж',
      positionId: posDivisionHead.id,
      employmentDate: new Date('2021-09-01'),
    },
    {
      email: 'kuznetsova@global-learn.ru',
      fullname: 'Кузнецова Елена Ивановна',
      biography: 'Анализирует данные и готовит управленческую отчётность',
      division: 'Аналитический отдел',
      positionId: posSeniorManager.id,
      employmentDate: new Date('2023-01-15'),
    },
    {
      email: 'novikov@global-learn.ru',
      fullname: 'Новиков Артём Владимирович',
      biography: 'Отвечает за digital-маркетинг и продвижение',
      division: 'Отдел маркетинга',
      positionId: posManager.id,
      employmentDate: new Date('2023-04-10'),
    },
    {
      email: 'morozova@global-learn.ru',
      fullname: 'Морозова Анна Дмитриевна',
      biography: 'Специалист по обеспечению продаж и работе с партнёрами',
      division: 'Отдел обеспечения продаж',
      positionId: undefined,
      employmentDate: new Date('2023-06-01'),
    },
    {
      email: 'volkov@global-learn.ru',
      fullname: 'Волков Сергей Михайлович',
      biography: 'Контролирует финансовые потоки и бюджетирование',
      division: 'Финансовый отдел',
      positionId: posManager.id,
      employmentDate: new Date('2022-11-01'),
    },
    {
      email: 'kozlova@global-learn.ru',
      fullname: 'Козлова Ольга Александровна',
      biography: 'Развивает внутреннее обучение и корпоративную культуру',
      division: 'Отдел развития и обучения',
      positionId: posSeniorManager.id,
      employmentDate: new Date('2021-06-14'),
    },
    {
      email: 'lebedev@global-learn.ru',
      fullname: 'Лебедев Михаил Юрьевич',
      biography: 'Менеджер по работе с клиентами',
      division: 'Отдел продаж',
      positionId: posManager.id,
      employmentDate: new Date('2024-01-09'),
    },
    {
      email: 'sokolova@global-learn.ru',
      fullname: 'Соколова Татьяна Борисовна',
      biography: 'Координирует сервисное обслуживание клиентов',
      division: 'Отдел сервиса и обслуживания',
      positionId: posManager.id,
      employmentDate: new Date('2023-09-18'),
    },

    // ── ИТ-отдел (подчинённые Иванова, division_head) ──────────────────────
    {
      email: 'grigoriev@global-learn.ru',
      fullname: 'Григорьев Павел Андреевич',
      biography: 'Старший инженер, ведёт инфраструктуру и DevOps',
      division: 'ИТ-отдел',
      positionId: posSeniorManager.id,
      employmentDate: new Date('2022-05-20'),
    },
    {
      email: 'fedorov@global-learn.ru',
      fullname: 'Фёдоров Илья Романович',
      biography: 'Системный администратор, поддержка рабочих станций и сети',
      division: 'ИТ-отдел',
      positionId: posManager.id,
      employmentDate: new Date('2023-02-13'),
    },
    {
      email: 'mikhailova@global-learn.ru',
      fullname: 'Михайлова Дарья Олеговна',
      biography: 'Специалист технической поддержки 2-й линии',
      division: 'ИТ-отдел',
      positionId: posManager.id,
      employmentDate: new Date('2023-08-07'),
    },
    {
      email: 'orlov@global-learn.ru',
      fullname: 'Орлов Никита Сергеевич',
      biography: 'Инженер по информационной безопасности',
      division: 'ИТ-отдел',
      positionId: posManager.id,
      employmentDate: new Date('2024-02-26'),
    },

    // ── Отдел разработки (подчинённые Петровой, senior_manager) ────────────
    {
      email: 'vasilieva@global-learn.ru',
      fullname: 'Васильева Екатерина Игоревна',
      biography: 'Frontend-разработчик, отвечает за клиентскую часть LMS',
      division: 'Отдел разработки',
      positionId: posManager.id,
      employmentDate: new Date('2023-03-06'),
    },
    {
      email: 'pavlov@global-learn.ru',
      fullname: 'Павлов Антон Викторович',
      biography: 'Backend-разработчик, проектирует API и интеграции',
      division: 'Отдел разработки',
      positionId: posManager.id,
      employmentDate: new Date('2023-05-22'),
    },
    {
      email: 'nikitin@global-learn.ru',
      fullname: 'Никитин Григорий Павлович',
      biography: 'Fullstack-разработчик, занимается отчётностью и аналитикой',
      division: 'Отдел разработки',
      positionId: posManager.id,
      employmentDate: new Date('2023-11-13'),
    },
    {
      email: 'romanova@global-learn.ru',
      fullname: 'Романова Алиса Дмитриевна',
      biography: 'QA-инженер, автоматизация тестирования',
      division: 'Отдел разработки',
      positionId: posManager.id,
      employmentDate: new Date('2024-04-15'),
    },

    // ── Отдел маркетинга (доп. сотрудники департамента) ────────────────────
    {
      email: 'belova@global-learn.ru',
      fullname: 'Белова Виктория Олеговна',
      biography: 'SMM-специалист, ведёт социальные сети и контент-план',
      division: 'Отдел маркетинга',
      positionId: posManager.id,
      employmentDate: new Date('2023-07-24'),
    },
    {
      email: 'egorov@global-learn.ru',
      fullname: 'Егоров Максим Алексеевич',
      biography: 'Performance-маркетолог, отвечает за платный трафик',
      division: 'Отдел маркетинга',
      positionId: posManager.id,
      employmentDate: new Date('2024-01-22'),
    },
  ];

  // Map positionId → roleId so each employee gets the role matching their position
  const positionRoleMap: Record<string, string> = {
    [posDeptHead.id]: deptHeadRole.id,
    [posDivisionHead.id]: divHeadRole.id,
    [posSeniorManager.id]: seniorManagerRole.id,
    [posManager.id]: managerRole.id,
  };

  const employeeIds: Record<string, string> = {};
  for (const emp of employeeProfiles) {
    const existing = await prisma.user.findUnique({
      where: { email: emp.email },
    });
    if (!existing) {
      const id = randomUUID();
      const roleId = emp.positionId
        ? (positionRoleMap[emp.positionId] ?? managerRole.id)
        : managerRole.id;
      await prisma.user.create({
        data: {
          id,
          email: emp.email,
          hashedPassword: hashedDefaultPassword,
          roleId,
          employee: {
            create: {
              fullname: emp.fullname,
              biography: emp.biography,
              employmentDate: emp.employmentDate,
              divisionId: divisionIds[emp.division],
              positionId: emp.positionId ?? null,
            },
          },
        },
      });
      employeeIds[emp.email] = id;
    } else {
      employeeIds[emp.email] = existing.id;
    }
  }
  console.log(`✓ Employees: ${employeeProfiles.length} profiles`);

  // ── Course 1: Корпоративная культура ──────────────────────────────────────
  let course1Id: string;
  const existingCourse1 = await prisma.course.findFirst({
    where: { name: 'Корпоративная культура и ценности' },
  });

  if (!existingCourse1) {
    const [lesson1, lesson2, lesson3] = await Promise.all([
      prisma.lesson.create({
        data: {
          name: 'История и миссия компании',
          content: [
            '# История компании',
            '',
            'Наша компания основана в 2010 году с единственной целью — сделать корпоративное обучение доступным и эффективным.',
            '',
            '## Этапы развития',
            '- **2010** — основание, первые 20 сотрудников',
            '- **2014** — выход на федеральный рынок',
            '- **2019** — запуск внутренней LMS-платформы',
            '- **2023** — более 500 сотрудников по всей стране',
            '',
            '## Миссия',
            'Развивать людей, чтобы вместе двигаться к общей цели.',
          ].join('\n'),
        },
      }),
      prisma.lesson.create({
        data: {
          name: 'Корпоративные ценности',
          content: [
            '# Наши ценности',
            '',
            '## Честность',
            'Мы говорим правду — коллегам, клиентам, самим себе. Ошибки не скрываются, а разбираются.',
            '',
            '## Открытость',
            'Информация доступна каждому, кому она нужна для работы. Мы против сайлосов.',
            '',
            '## Результат',
            'Мы фокусируемся на том, что важно для клиента и компании, а не на формальном выполнении задач.',
            '',
            '## Развитие',
            'Учимся постоянно — через ошибки, обратную связь и этот курс.',
          ].join('\n'),
        },
      }),
      prisma.lesson.create({
        data: {
          name: 'Рабочие процессы и инструменты',
          content: [
            '# Инструменты и процессы',
            '',
            '## Коммуникации',
            '- Slack — ежедневная коммуникация',
            '- Zoom / Meet — встречи и 1:1',
            '- Confluence — база знаний',
            '',
            '## Управление задачами',
            '- Jira / YouTrack — трекинг задач',
            '- GitLab — код и CI/CD',
            '',
            '## Рабочий ритм',
            '- Стендапы: 9:30 ежедневно',
            '- Ретро: раз в спринт',
            '- 1:1 с руководителем: раз в две недели',
          ].join('\n'),
        },
      }),
    ]);

    const test1 = await prisma.test.create({
      data: {
        name: 'Тест по корпоративной культуре',
        passingPercent: 70,
      },
    });

    const course1 = await prisma.course.create({
      data: {
        name: 'Корпоративная культура и ценности',
        description:
          'Обязательный курс для всех сотрудников. Познакомьтесь с историей, миссией и ценностями компании, а также с рабочими инструментами.',
        scope: 'ALL',
        authorId: adminEmployeeId,
        modules: {
          create: [
            {
              name: 'Знакомство с компанией',
              position: 1,
              steps: {
                create: [
                  {
                    name: 'История и миссия',
                    position: 1,
                    type: 'LESSON',
                    lessonId: lesson1.id,
                  },
                  {
                    name: 'Ценности и принципы',
                    position: 2,
                    type: 'LESSON',
                    lessonId: lesson2.id,
                  },
                ],
              },
            },
            {
              name: 'Рабочая среда',
              position: 2,
              steps: {
                create: [
                  {
                    name: 'Инструменты и процессы',
                    position: 1,
                    type: 'LESSON',
                    lessonId: lesson3.id,
                  },
                  {
                    name: 'Проверка знаний',
                    position: 2,
                    type: 'TEST',
                    testId: test1.id,
                  },
                ],
              },
            },
          ],
        },
      },
    });
    course1Id = course1.id;

    // Question bank
    const bankQ1 = await prisma.courseQuestion.create({
      data: {
        courseId: course1Id,
        question: 'В каком году была основана компания?',
        answers: {
          create: [
            { answer: '2008', isCorrect: false },
            { answer: '2010', isCorrect: true },
            { answer: '2012', isCorrect: false },
            { answer: '2015', isCorrect: false },
          ],
        },
      },
    });
    const bankQ2 = await prisma.courseQuestion.create({
      data: {
        courseId: course1Id,
        question: 'Какое утверждение отражает ценность «Честность»?',
        answers: {
          create: [
            {
              answer: 'Скрывать ошибки, чтобы не портить репутацию',
              isCorrect: false,
            },
            {
              answer: 'Открыто признавать ошибки и разбирать их',
              isCorrect: true,
            },
            { answer: 'Критиковать коллег публично', isCorrect: false },
            {
              answer: 'Соглашаться со всем, что говорит руководство',
              isCorrect: false,
            },
          ],
        },
      },
    });
    const bankQ3 = await prisma.courseQuestion.create({
      data: {
        courseId: course1Id,
        question: 'Что является главным инструментом ежедневных коммуникаций?',
        answers: {
          create: [
            { answer: 'Email', isCorrect: false },
            { answer: 'Slack', isCorrect: true },
            { answer: 'Telegram', isCorrect: false },
            { answer: 'WhatsApp', isCorrect: false },
          ],
        },
      },
    });
    const bankQ4 = await prisma.courseQuestion.create({
      data: {
        courseId: course1Id,
        question: 'Что означает ценность «Открытость»?',
        answers: {
          create: [
            {
              answer: 'Публиковать внутренние данные в интернете',
              isCorrect: false,
            },
            {
              answer: 'Делиться нужной информацией с коллегами без барьеров',
              isCorrect: true,
            },
            {
              answer: 'Всегда оставлять двери в переговорки открытыми',
              isCorrect: false,
            },
          ],
        },
      },
    });
    const bankQ5 = await prisma.courseQuestion.create({
      data: {
        courseId: course1Id,
        question: 'Как часто проводится 1:1 с руководителем?',
        answers: {
          create: [
            { answer: 'Раз в день', isCorrect: false },
            { answer: 'Раз в неделю', isCorrect: false },
            { answer: 'Раз в две недели', isCorrect: true },
            { answer: 'Раз в месяц', isCorrect: false },
          ],
        },
      },
    });
    const bankQ6 = await prisma.courseQuestion.create({
      data: {
        courseId: course1Id,
        question: 'Какой инструмент используется для трекинга задач?',
        answers: {
          create: [
            { answer: 'Notion', isCorrect: false },
            { answer: 'Excel', isCorrect: false },
            { answer: 'Jira / YouTrack', isCorrect: true },
          ],
        },
      },
    });

    await prisma.testQuestion.createMany({
      data: [
        { testId: test1.id, questionId: bankQ1.id },
        { testId: test1.id, questionId: bankQ2.id },
        { testId: test1.id, questionId: bankQ3.id },
        { testId: test1.id, questionId: bankQ4.id },
        { testId: test1.id, questionId: bankQ5.id },
        { testId: test1.id, questionId: bankQ6.id },
      ],
    });

    console.log(
      '✓ Course 1: Корпоративная культура и ценности (2 модуля, 6 вопросов)',
    );
  } else {
    course1Id = existingCourse1.id;
    console.log('○ Course 1 already exists');
  }

  // ── Course 2: Техники продаж ───────────────────────────────────────────────
  let course2Id: string;
  const existingCourse2 = await prisma.course.findFirst({
    where: { name: 'Техники продаж' },
  });

  if (!existingCourse2) {
    const [lesson4, lesson5, lesson6] = await Promise.all([
      prisma.lesson.create({
        data: {
          name: 'SPIN-продажи: теория и практика',
          content: [
            '# SPIN-продажи',
            '',
            'Методика разработана Neil Rackham на основе 12 лет исследований 35 000 сделок.',
            '',
            '## Структура SPIN',
            '- **S** — Situation (ситуационные вопросы): «Как сейчас устроен ваш процесс?»',
            '- **P** — Problem (проблемные вопросы): «Какие трудности вы испытываете?»',
            '- **I** — Implication (извлекающие вопросы): «Что произойдёт, если проблему не решить?»',
            '- **N** — Need-payoff (направляющие вопросы): «Как изменится ситуация, если вы это решите?»',
            '',
            '## Ключевой принцип',
            'Не рассказывать о продукте — задавать вопросы, которые помогают клиенту самому прийти к решению.',
          ].join('\n'),
        },
      }),
      prisma.lesson.create({
        data: {
          name: 'Работа с возражениями',
          content: [
            '# Возражения клиента',
            '',
            'Возражение — это не «нет», это запрос на дополнительную информацию или сигнал о незакрытой потребности.',
            '',
            '## Типичные возражения и ответы',
            '',
            '### «Слишком дорого»',
            'Уточните, с чем сравнивает клиент. Переведите цену в ценность: ROI, экономия времени, снижение рисков.',
            '',
            '### «Нам это не нужно сейчас»',
            'Выясните, когда «сейчас» изменится. Используйте извлекающие вопросы о последствиях откладывания.',
            '',
            '### «Мы работаем с другим поставщиком»',
            'Не атакуйте конкурента. Спросите, что им нравится и что хотелось бы улучшить.',
            '',
            '## Алгоритм ответа на возражение',
            '1. Выслушайте до конца',
            '2. Согласитесь с чувствами клиента (не с возражением)',
            '3. Уточните суть',
            '4. Ответьте с фактами или историей',
          ].join('\n'),
        },
      }),
      prisma.lesson.create({
        data: {
          name: 'Ведение переговоров и закрытие сделки',
          content: [
            '# Переговоры и закрытие',
            '',
            '## Подготовка к переговорам',
            '- Определите BATNA (лучшая альтернатива соглашению)',
            '- Установите минимально приемлемые условия',
            '- Изучите позицию другой стороны заранее',
            '',
            '## Техники закрытия',
            '',
            '### Предположительное закрытие',
            '«Когда вам удобнее получить первую поставку — в понедельник или в среду?»',
            '',
            '### Закрытие на основе выгоды',
            '«Вы сказали, что хотите сократить время обработки заказов. Наш продукт даст вам это уже с первого месяца.»',
            '',
            '### Резюмирующее закрытие',
            'Перечислите все согласованные пункты и попросите подтверждения.',
          ].join('\n'),
        },
      }),
    ]);

    const test2 = await prisma.test.create({
      data: {
        name: 'Итоговый тест по техникам продаж',
        passingPercent: 75,
      },
    });

    const course2 = await prisma.course.create({
      data: {
        name: 'Техники продаж',
        description:
          'Курс для менеджеров отдела продаж. Освойте методологию SPIN, научитесь работать с возражениями и закрывать сделки.',
        scope: 'DEPARTMENT',
        departmentId: departmentIds['Департамент продаж'],
        authorId: adminEmployeeId,
        modules: {
          create: [
            {
              name: 'Методологии продаж',
              position: 1,
              steps: {
                create: [
                  {
                    name: 'SPIN-продажи',
                    position: 1,
                    type: 'LESSON',
                    lessonId: lesson4.id,
                  },
                  {
                    name: 'Работа с возражениями',
                    position: 2,
                    type: 'LESSON',
                    lessonId: lesson5.id,
                  },
                ],
              },
            },
            {
              name: 'Переговоры и закрытие',
              position: 2,
              steps: {
                create: [
                  {
                    name: 'Ведение переговоров',
                    position: 1,
                    type: 'LESSON',
                    lessonId: lesson6.id,
                  },
                  {
                    name: 'Итоговый тест',
                    position: 2,
                    type: 'TEST',
                    testId: test2.id,
                  },
                ],
              },
            },
          ],
        },
      },
    });
    course2Id = course2.id;

    const bq1 = await prisma.courseQuestion.create({
      data: {
        courseId: course2Id,
        question: 'Что означает аббревиатура SPIN?',
        answers: {
          create: [
            {
              answer: 'Situation, Problem, Implication, Need-payoff',
              isCorrect: true,
            },
            { answer: 'Sales, Planning, Insights, Network', isCorrect: false },
            {
              answer: 'Strategy, Process, Influence, Negotiation',
              isCorrect: false,
            },
          ],
        },
      },
    });
    const bq2 = await prisma.courseQuestion.create({
      data: {
        courseId: course2Id,
        question:
          'Как правильно реагировать на возражение «Это слишком дорого»?',
        answers: {
          create: [
            {
              answer: 'Сразу предложить максимальную скидку',
              isCorrect: false,
            },
            {
              answer:
                'Уточнить, с чем клиент сравнивает цену, и перевести в ценность',
              isCorrect: true,
            },
            { answer: 'Прекратить переговоры', isCorrect: false },
            { answer: 'Настаивать на цене без объяснений', isCorrect: false },
          ],
        },
      },
    });
    const bq3 = await prisma.courseQuestion.create({
      data: {
        courseId: course2Id,
        question: 'Что такое «извлекающий вопрос» в SPIN?',
        answers: {
          create: [
            { answer: 'Вопрос о бюджете клиента', isCorrect: false },
            {
              answer:
                'Вопрос о последствиях и потерях, если проблема не решена',
              isCorrect: true,
            },
            { answer: 'Вопрос о времени следующей встречи', isCorrect: false },
          ],
        },
      },
    });
    const bq4 = await prisma.courseQuestion.create({
      data: {
        courseId: course2Id,
        question: 'Что такое BATNA в переговорах?',
        answers: {
          create: [
            { answer: 'Шаблон коммерческого предложения', isCorrect: false },
            {
              answer: 'Лучшая альтернатива соглашению с этим клиентом',
              isCorrect: true,
            },
            { answer: 'Список возражений клиента', isCorrect: false },
            { answer: 'Скрипт холодного звонка', isCorrect: false },
          ],
        },
      },
    });
    const bq5 = await prisma.courseQuestion.create({
      data: {
        courseId: course2Id,
        question: 'Какой приём относится к «предположительному закрытию»?',
        answers: {
          create: [
            { answer: '«Вы готовы купить?»', isCorrect: false },
            {
              answer: '«Когда вам удобнее — в понедельник или в среду?»',
              isCorrect: true,
            },
            { answer: '«Подумайте и перезвоните»', isCorrect: false },
          ],
        },
      },
    });

    await prisma.testQuestion.createMany({
      data: [
        { testId: test2.id, questionId: bq1.id },
        { testId: test2.id, questionId: bq2.id },
        { testId: test2.id, questionId: bq3.id },
        { testId: test2.id, questionId: bq4.id },
        { testId: test2.id, questionId: bq5.id },
      ],
    });

    console.log('✓ Course 2: Техники продаж (2 модуля, 5 вопросов)');
  } else {
    course2Id = existingCourse2.id;
    console.log('○ Course 2 already exists');
  }

  // ── Курсы Отдела разработки: Excel (scope = DIVISION) ─────────────────────
  const devDivisionId = divisionIds['Отдел разработки'];

  await seedCourse({
    name: 'Excel для разработчиков: формулы и функции',
    description:
      'Практический курс по Excel для команды разработки: формулы, ссылки, поиск и логические функции для работы с выгрузками и отчётами.',
    scope: 'DIVISION',
    divisionId: devDivisionId,
    authorId: adminEmployeeId,
    passingPercent: 70,
    lessons: [
      {
        name: 'Формулы и ссылки',
        content: [
          '# Формулы и ссылки',
          '',
          'Любая формула начинается со знака `=`.',
          '',
          '## Относительные и абсолютные ссылки',
          '- `A1` — относительная: меняется при копировании',
          '- `$A$1` — абсолютная: зафиксированы и столбец, и строка',
          '- `$A1` / `A$1` — смешанные',
          '',
          '## Базовые функции',
          '- `SUM`, `AVERAGE`, `MIN`, `MAX`',
          '- `COUNT` / `COUNTA` — счёт чисел / непустых ячеек',
        ].join('\n'),
      },
      {
        name: 'Поиск данных: VLOOKUP и INDEX/MATCH',
        content: [
          '# Поиск данных',
          '',
          '## VLOOKUP',
          '`=VLOOKUP(искомое; диапазон; номер_столбца; 0)` — точный поиск по первому столбцу.',
          '',
          '## INDEX + MATCH',
          'Более гибкая связка: ищет в любом направлении.',
          '`=INDEX(столбец_результата; MATCH(искомое; столбец_поиска; 0))`',
          '',
          '> INDEX/MATCH не ломается при вставке столбцов, в отличие от VLOOKUP.',
        ].join('\n'),
      },
      {
        name: 'Логические функции',
        content: [
          '# Логика в Excel',
          '',
          '## IF',
          '`=IF(условие; значение_если_истина; значение_если_ложь)`',
          '',
          '## Вложенные условия и IFS',
          '`=IFS(усл1; знач1; усл2; знач2; ...)` — читаемее вложенных IF.',
          '',
          '## Агрегаты по условию',
          '- `SUMIF` / `SUMIFS`',
          '- `COUNTIF` / `COUNTIFS`',
        ].join('\n'),
      },
    ],
    questions: [
      {
        question: 'Что означает ссылка `$A$1`?',
        answers: [
          { answer: 'Относительная ссылка', isCorrect: false },
          {
            answer: 'Абсолютная: зафиксированы столбец и строка',
            isCorrect: true,
          },
          { answer: 'Ссылка на другой лист', isCorrect: false },
          { answer: 'Ошибка в формуле', isCorrect: false },
        ],
      },
      {
        question: 'Какой аргумент VLOOKUP включает точный поиск?',
        answers: [
          { answer: '1 (TRUE)', isCorrect: false },
          { answer: '0 (FALSE)', isCorrect: true },
          { answer: 'Любой текст', isCorrect: false },
        ],
      },
      {
        question: 'Чем INDEX/MATCH лучше VLOOKUP?',
        answers: [
          { answer: 'Работает только сверху вниз', isCorrect: false },
          {
            answer: 'Ищет в любом направлении и устойчив к вставке столбцов',
            isCorrect: true,
          },
          { answer: 'Не требует диапазона', isCorrect: false },
        ],
      },
      {
        question: 'Какая функция суммирует значения по условию?',
        answers: [
          { answer: 'SUMIF', isCorrect: true },
          { answer: 'CONCAT', isCorrect: false },
          { answer: 'TRIM', isCorrect: false },
          { answer: 'LEN', isCorrect: false },
        ],
      },
    ],
  });

  await seedCourse({
    name: 'Excel: сводные таблицы и анализ данных',
    description:
      'Сводные таблицы, срезы и визуализация для быстрого анализа больших выгрузок. Для аналитики внутри отдела разработки.',
    scope: 'DIVISION',
    divisionId: devDivisionId,
    authorId: adminEmployeeId,
    passingPercent: 70,
    lessons: [
      {
        name: 'Сводные таблицы (PivotTable)',
        content: [
          '# Сводные таблицы',
          '',
          'Сводная таблица агрегирует данные без формул: перетаскиванием полей в области **Строки**, **Столбцы**, **Значения**, **Фильтры**.',
          '',
          '## Когда использовать',
          '- Нужны итоги по группам (сумма, среднее, количество)',
          '- Данные регулярно обновляются — достаточно нажать «Обновить»',
        ].join('\n'),
      },
      {
        name: 'Срезы и диаграммы',
        content: [
          '# Срезы и визуализация',
          '',
          '## Срезы (Slicers)',
          'Кнопочные фильтры поверх сводной — удобно для интерактивных дашбордов.',
          '',
          '## Диаграммы',
          '- Гистограмма — сравнение категорий',
          '- Линейная — динамика во времени',
          '- Круговая — доли (не больше 5-6 секторов)',
        ].join('\n'),
      },
    ],
    questions: [
      {
        question: 'Что делает сводная таблица?',
        answers: [
          {
            answer: 'Агрегирует данные по группам без ручных формул',
            isCorrect: true,
          },
          { answer: 'Удаляет дубликаты строк', isCorrect: false },
          { answer: 'Шифрует файл', isCorrect: false },
        ],
      },
      {
        question: 'Для чего нужны срезы (Slicers)?',
        answers: [
          { answer: 'Для интерактивной фильтрации сводной', isCorrect: true },
          { answer: 'Для печати листа', isCorrect: false },
          { answer: 'Для защиты ячеек', isCorrect: false },
        ],
      },
      {
        question: 'Какой тип диаграммы лучше для динамики во времени?',
        answers: [
          { answer: 'Круговая', isCorrect: false },
          { answer: 'Линейная', isCorrect: true },
          { answer: 'Кольцевая', isCorrect: false },
        ],
      },
    ],
  });

  // ── Курсы ИТ-отдела (scope = DIVISION) ────────────────────────────────────
  const itCourseDivisionId = divisionIds['ИТ-отдел'];

  await seedCourse({
    name: 'Основы информационной безопасности',
    description:
      'Базовая киберграмотность для ИТ-отдела: пароли, фишинг, защита данных и реакция на инциденты.',
    scope: 'DIVISION',
    divisionId: itCourseDivisionId,
    authorId: adminEmployeeId,
    passingPercent: 80,
    lessons: [
      {
        name: 'Пароли и двухфакторная аутентификация',
        content: [
          '# Пароли и 2FA',
          '',
          '- Длина важнее сложности: парольная фраза из 4+ слов надёжнее `P@ss1`',
          '- Уникальный пароль на каждый сервис → менеджер паролей',
          '- 2FA обязательна для почты, VPN и админских панелей',
        ].join('\n'),
      },
      {
        name: 'Фишинг и социальная инженерия',
        content: [
          '# Фишинг',
          '',
          'Большинство взломов начинается с письма, а не с эксплойта.',
          '',
          '## Признаки фишинга',
          '- Срочность и угрозы («аккаунт будет заблокирован»)',
          '- Несовпадение адреса отправителя и домена',
          '- Ссылки на поддельные формы входа',
          '',
          '> Не уверен — не кликай. Перешли письмо в ИБ.',
        ].join('\n'),
      },
      {
        name: 'Защита данных и инциденты',
        content: [
          '# Данные и инциденты',
          '',
          '## Классификация',
          '- Публичные / внутренние / конфиденциальные / персональные',
          '',
          '## Если случился инцидент',
          '1. Зафиксируй время и что произошло',
          '2. Отключи устройство от сети (не выключай)',
          '3. Сообщи в ИБ немедленно',
        ].join('\n'),
      },
    ],
    questions: [
      {
        question: 'Что надёжнее как пароль?',
        answers: [
          {
            answer: 'Короткий пароль со спецсимволами вроде P@ss1',
            isCorrect: false,
          },
          {
            answer: 'Длинная парольная фраза из нескольких слов',
            isCorrect: true,
          },
          { answer: 'Дата рождения', isCorrect: false },
        ],
      },
      {
        question: 'Какой признак указывает на фишинговое письмо?',
        answers: [
          {
            answer: 'Срочность и несовпадение домена отправителя',
            isCorrect: true,
          },
          {
            answer: 'Письмо от известного коллеги без вложений',
            isCorrect: false,
          },
          { answer: 'Подпись с номером телефона', isCorrect: false },
        ],
      },
      {
        question: 'Первое действие при подозрении на компрометацию устройства?',
        answers: [
          { answer: 'Выключить устройство полностью', isCorrect: false },
          { answer: 'Отключить от сети и сообщить в ИБ', isCorrect: true },
          { answer: 'Переустановить ОС', isCorrect: false },
        ],
      },
      {
        question: 'Для каких систем 2FA обязательна?',
        answers: [
          { answer: 'Только для развлекательных сервисов', isCorrect: false },
          { answer: 'Для почты, VPN и админских панелей', isCorrect: true },
          { answer: '2FA не нужна, если пароль сложный', isCorrect: false },
        ],
      },
    ],
  });

  await seedCourse({
    name: 'Администрирование Linux: базовый уровень',
    description:
      'Командная строка, файловая система, права доступа и службы — необходимый минимум для ИТ-специалиста.',
    scope: 'DIVISION',
    divisionId: itCourseDivisionId,
    authorId: adminEmployeeId,
    passingPercent: 75,
    lessons: [
      {
        name: 'Командная строка и файловая система',
        content: [
          '# Терминал',
          '',
          '- `pwd` — текущий каталог, `ls -la` — содержимое',
          '- `cd`, `cp`, `mv`, `rm` — навигация и операции',
          '- `cat`, `less`, `grep` — чтение и поиск',
          '',
          'Всё есть файл: устройства, процессы и настройки.',
        ].join('\n'),
      },
      {
        name: 'Права доступа и пользователи',
        content: [
          '# Права доступа',
          '',
          '`rwx` для владельца / группы / остальных.',
          '- `chmod 644 file` — rw-r--r--',
          '- `chown user:group file` — сменить владельца',
          '- `sudo` — выполнение с правами root',
        ].join('\n'),
      },
      {
        name: 'Процессы и службы',
        content: [
          '# Процессы и службы',
          '',
          '- `ps aux`, `top`/`htop` — список процессов',
          '- `kill`, `kill -9` — завершение',
          '- `systemctl status|start|stop|restart <service>` — управление службами',
          '- `journalctl -u <service>` — логи службы',
        ].join('\n'),
      },
    ],
    questions: [
      {
        question: 'Какая команда показывает текущий каталог?',
        answers: [
          { answer: 'pwd', isCorrect: true },
          { answer: 'cd', isCorrect: false },
          { answer: 'ls', isCorrect: false },
        ],
      },
      {
        question: 'Что означает `chmod 644 file`?',
        answers: [
          { answer: 'rwx для всех', isCorrect: false },
          {
            answer: 'rw для владельца, r для группы и остальных',
            isCorrect: true,
          },
          { answer: 'Полный запрет доступа', isCorrect: false },
        ],
      },
      {
        question: 'Чем управляют службами в systemd?',
        answers: [
          { answer: 'systemctl', isCorrect: true },
          { answer: 'grep', isCorrect: false },
          { answer: 'chown', isCorrect: false },
        ],
      },
      {
        question: 'Как посмотреть логи конкретной службы?',
        answers: [
          { answer: 'journalctl -u <service>', isCorrect: true },
          { answer: 'cat /etc/passwd', isCorrect: false },
          { answer: 'ps aux', isCorrect: false },
        ],
      },
    ],
  });

  await seedCourse({
    name: 'Компьютерные сети: базис для IT',
    description:
      'Модель TCP/IP, адресация и ключевые протоколы — фундамент для диагностики и поддержки.',
    scope: 'DIVISION',
    divisionId: itCourseDivisionId,
    authorId: adminEmployeeId,
    passingPercent: 70,
    lessons: [
      {
        name: 'Модель OSI и TCP/IP',
        content: [
          '# Сетевые модели',
          '',
          'TCP/IP-стек: канальный → сетевой → транспортный → прикладной.',
          '- TCP — надёжная доставка с подтверждением',
          '- UDP — быстро, без гарантий (видео, DNS-запросы)',
        ].join('\n'),
      },
      {
        name: 'IP-адресация и подсети',
        content: [
          '# IP и подсети',
          '',
          '- IPv4: 4 октета, напр. `192.168.1.10`',
          '- Маска `/24` = 256 адресов (254 хоста)',
          '- Приватные диапазоны: `10.0.0.0/8`, `192.168.0.0/16`',
        ].join('\n'),
      },
      {
        name: 'DNS, HTTP и диагностика',
        content: [
          '# Протоколы и диагностика',
          '',
          '- DNS превращает имя в IP',
          '- HTTP/HTTPS — веб (порты 80/443)',
          '- Инструменты: `ping`, `traceroute`, `nslookup`, `curl`',
        ].join('\n'),
      },
    ],
    questions: [
      {
        question: 'Чем TCP отличается от UDP?',
        answers: [
          {
            answer:
              'TCP — надёжная доставка с подтверждением, UDP — быстрая без гарантий',
            isCorrect: true,
          },
          { answer: 'UDP надёжнее TCP', isCorrect: false },
          { answer: 'Это одно и то же', isCorrect: false },
        ],
      },
      {
        question: 'Сколько хостов в подсети с маской /24?',
        answers: [
          { answer: '254', isCorrect: true },
          { answer: '1024', isCorrect: false },
          { answer: '64', isCorrect: false },
        ],
      },
      {
        question: 'Что делает DNS?',
        answers: [
          { answer: 'Превращает доменное имя в IP-адрес', isCorrect: true },
          { answer: 'Шифрует трафик', isCorrect: false },
          { answer: 'Раздаёт IP-адреса', isCorrect: false },
        ],
      },
      {
        question: 'Какой порт по умолчанию у HTTPS?',
        answers: [
          { answer: '443', isCorrect: true },
          { answer: '80', isCorrect: false },
          { answer: '22', isCorrect: false },
        ],
      },
    ],
  });

  // ── Общий курс (scope = ALL) ──────────────────────────────────────────────
  await seedCourse({
    name: 'Тайм-менеджмент и личная эффективность',
    description:
      'Приоритизация, планирование и борьба с прокрастинацией. Доступен всем сотрудникам.',
    scope: 'ALL',
    authorId: adminEmployeeId,
    passingPercent: 70,
    lessons: [
      {
        name: 'Приоритизация: матрица Эйзенхауэра',
        content: [
          '# Матрица Эйзенхауэра',
          '',
          '| | Срочно | Не срочно |',
          '|---|---|---|',
          '| **Важно** | Сделать сейчас | Запланировать |',
          '| **Не важно** | Делегировать | Удалить |',
          '',
          'Большая часть результата приходит из квадранта «Важно / Не срочно».',
        ].join('\n'),
      },
      {
        name: 'Планирование и фокус',
        content: [
          '# Планирование',
          '',
          '- Правило 1-3-5: 1 крупная, 3 средних, 5 мелких задач на день',
          '- Тайм-блокинг: резервируйте время в календаре под задачи',
          '- Pomodoro: 25 минут работы / 5 минут отдыха',
        ].join('\n'),
      },
    ],
    questions: [
      {
        question:
          'Какой квадрант матрицы Эйзенхауэра даёт наибольший долгосрочный результат?',
        answers: [
          { answer: 'Важно / Не срочно', isCorrect: true },
          { answer: 'Не важно / Срочно', isCorrect: false },
          { answer: 'Не важно / Не срочно', isCorrect: false },
        ],
      },
      {
        question: 'Что предлагает техника Pomodoro?',
        answers: [
          { answer: '25 минут работы и 5 минут отдыха', isCorrect: true },
          { answer: 'Работать без перерывов 4 часа', isCorrect: false },
          { answer: 'Делать только срочные задачи', isCorrect: false },
        ],
      },
      {
        question: 'Что такое тайм-блокинг?',
        answers: [
          {
            answer: 'Резервирование времени в календаре под конкретные задачи',
            isCorrect: true,
          },
          { answer: 'Блокировка уведомлений навсегда', isCorrect: false },
          { answer: 'Отказ от планирования', isCorrect: false },
        ],
      },
    ],
  });

  // ── Onboarding Template 1: division-only для ИТ-отдела ────────────────────
  const itDivisionId = divisionIds['ИТ-отдел'];
  const existingT1 = await prisma.onboardingTemplate.findFirst({
    where: { positionId: null, divisionId: itDivisionId },
  });

  if (!existingT1) {
    await prisma.onboardingTemplate.create({
      data: {
        name: 'Общий онбординг ИТ-отдела',
        description:
          'Базовая программа адаптации для всех сотрудников ИТ-отдела, независимо от должности.',
        positionId: null,
        divisionId: itDivisionId,
        steps: {
          create: [
            {
              position: 1,
              name: 'Знакомство с командой',
              description:
                'Познакомьтесь с каждым членом команды лично или в видеозвонке. Получите все рабочие доступы.',
              type: 'TEXT',
              recommendedStartOffsetDays: 0,
              recommendedEndOffsetDays: 2,
              feedbackOptions: {
                create: [
                  { label: 'Познакомился с командой' },
                  { label: 'Получил доступы к системам' },
                  { label: 'Настроил рабочее место' },
                ],
              },
            },
            {
              position: 2,
              name: 'Обязательный курс о компании',
              description:
                'Пройдите курс «Корпоративная культура и ценности». Там вы найдёте всё о миссии, инструментах и процессах.',
              type: 'COURSE',
              courseId: course1Id,
              recommendedStartOffsetDays: 1,
              recommendedEndOffsetDays: 7,
              feedbackOptions: {
                create: [
                  { label: 'Курс полностью пройден' },
                  { label: 'Тест сдан на 70%+' },
                ],
              },
            },
            {
              position: 3,
              name: 'Знакомство с техническими процессами',
              description:
                'Изучите внутренний Git-flow, соглашения по коду, правила код-ревью и порядок деплоя в production.',
              type: 'TEXT',
              recommendedStartOffsetDays: 7,
              recommendedEndOffsetDays: 14,
              feedbackOptions: {
                create: [
                  { label: 'Изучил Git-flow' },
                  { label: 'Ознакомился с code style' },
                  { label: 'Прошёл первое код-ревью' },
                  { label: 'Сделал первый самостоятельный коммит' },
                ],
              },
            },
            {
              position: 4,
              name: 'Первая задача в проекте',
              description:
                'Возьмите первую задачу из бэклога и доведите её до production под наблюдением наставника.',
              type: 'TEXT',
              recommendedStartOffsetDays: 14,
              recommendedEndOffsetDays: 30,
              feedbackOptions: {
                create: [
                  { label: 'Задача взята в работу' },
                  { label: 'PR создан и прошёл ревью' },
                  { label: 'Задача задеплоена в production' },
                ],
              },
            },
          ],
        },
      },
    });
    console.log('✓ Onboarding template 1: ИТ-отдел (без привязки к должности)');
  } else {
    console.log('○ Onboarding template 1 already exists');
  }

  // ── Onboarding Template 2: Менеджер + Отдел продаж ────────────────────────
  const salesDivisionId = divisionIds['Отдел продаж'];
  const existingT2 = await prisma.onboardingTemplate.findFirst({
    where: { positionId: posManager.id, divisionId: salesDivisionId },
  });

  if (!existingT2) {
    await prisma.onboardingTemplate.create({
      data: {
        name: 'Онбординг менеджера по продажам',
        description:
          'Программа адаптации для менеджеров отдела продаж: CRM, KPI, обучение методологиям и первая сделка.',
        positionId: posManager.id,
        divisionId: salesDivisionId,
        steps: {
          create: [
            {
              position: 1,
              name: 'Введение в процессы отдела',
              description:
                'Изучите CRM-систему, стандарты общения с клиентами, KPI отдела и цикл сделки.',
              type: 'TEXT',
              recommendedStartOffsetDays: 0,
              recommendedEndOffsetDays: 3,
              feedbackOptions: {
                create: [
                  { label: 'Получил доступ к CRM' },
                  { label: 'Изучил стандарты общения' },
                  { label: 'Ознакомился с KPI' },
                  { label: 'Изучил базу клиентов' },
                ],
              },
            },
            {
              position: 2,
              name: 'Корпоративный курс',
              description:
                'Пройдите обязательный курс по корпоративной культуре.',
              type: 'COURSE',
              courseId: course1Id,
              recommendedStartOffsetDays: 1,
              recommendedEndOffsetDays: 5,
              feedbackOptions: {
                create: [{ label: 'Курс пройден' }, { label: 'Тест сдан' }],
              },
            },
            {
              position: 3,
              name: 'Обучение техникам продаж',
              description:
                'Пройдите курс «Техники продаж» и освойте методологию SPIN.',
              type: 'COURSE',
              courseId: course2Id,
              recommendedStartOffsetDays: 5,
              recommendedEndOffsetDays: 14,
              feedbackOptions: {
                create: [
                  { label: 'Курс по продажам завершён' },
                  { label: 'Итоговый тест сдан на 75%+' },
                ],
              },
            },
            {
              position: 4,
              name: 'Первая самостоятельная сделка',
              description:
                'Проведите первую сделку с клиентом под наблюдением наставника. Получите обратную связь.',
              type: 'TEXT',
              recommendedStartOffsetDays: 14,
              recommendedEndOffsetDays: 30,
              feedbackOptions: {
                create: [
                  { label: 'Провёл первый звонок с клиентом' },
                  { label: 'Подготовил коммерческое предложение' },
                  { label: 'Получил обратную связь от наставника' },
                  { label: 'Сделка завершена (победа или анализ)' },
                ],
              },
            },
          ],
        },
      },
    });
    console.log('✓ Onboarding template 2: Менеджер + Отдел продаж');
  } else {
    console.log('○ Onboarding template 2 already exists');
  }

  console.log('\n🎉 Seed completed!');
  console.log(`   Admin login: ${adminEmail}`);
  console.log(
    `   Employee passwords: ${DEFAULT_PASSWORD} (env: SEED_PASSWORD)`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
