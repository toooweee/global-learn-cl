import 'dotenv/config';
import { PrismaClient } from '@generated/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as argon from 'argon2';
import { randomUUID } from 'node:crypto';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  const adminRole = await prisma.role.upsert({
    where: { name: 'Admin' },
    update: {},
    create: { name: 'Admin' },
  });

  await prisma.role.upsert({
    where: { name: 'Employee' },
    update: {},
    create: { name: 'Employee' },
  });

  console.log('Seeded roles: Admin, Employee');

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

  const createdDivisions: Record<string, string> = {};

  for (const item of companyStructure) {
    const dept = await prisma.department.upsert({
      where: { name: item.department },
      update: {},
      create: { name: item.department },
    });

    for (const divisionName of item.divisions) {
      const division = await prisma.division.upsert({
        where: { name: divisionName },
        update: {},
        create: {
          name: divisionName,
          departmentId: dept.id,
        },
      });
      createdDivisions[divisionName] = division.id;
    }
  }

  console.log('Seeded departments and divisions');

  const adminEmail = process.env.TEST_ADMIN_EMAIL!;
  const adminPassword = await argon.hash(process.env.TEST_ADMIN_PASSWORD!);

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const adminId = randomUUID();
    const defaultDivisionId = createdDivisions['ИТ-отдел'];

    await prisma.user.create({
      data: {
        id: adminId,
        email: adminEmail,
        hashedPassword: adminPassword,
        roleId: adminRole.id,
        employee: {
          create: {
            fullname: 'Администратор Системы',
            biography: 'Главный администратор платформы',
            employmentDate: new Date(),
            divisionId: defaultDivisionId,
          },
        },
      },
    });
    console.log('Seeded admin user with employee profile');
  } else {
    console.log('Admin user already exists');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
