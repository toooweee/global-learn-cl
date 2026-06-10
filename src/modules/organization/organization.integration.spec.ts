import { Test } from '@nestjs/testing';
import { CommandBus, CqrsModule, QueryBus } from '@nestjs/cqrs';
import { INestApplication } from '@nestjs/common';
import { None, Option, Some } from 'oxide.ts';
import { Department } from '@generated/client';
import { Paginated } from '@/libs/application/query.base';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { DepartmentMapper } from '@/modules/organization/department/department.mapper';
import { DepartmentEntity } from '@/modules/organization/department/domain/department.entity';
import {
  DEPARTMENT_REPOSITORY,
  DepartmentRepositoryPort,
} from '@/modules/organization/department/application/ports/department.repository.port';
import { CreateDepartmentCommand } from '@/modules/organization/department/application/commands/create-department/create-department.command';
import { CreateDepartmentCommandHandler } from '@/modules/organization/department/application/commands/create-department/create-department.command-handler';
import { UpdateDepartmentCommand } from '@/modules/organization/department/application/commands/update-department/update-department.command';
import { UpdateDepartmentCommandHandler } from '@/modules/organization/department/application/commands/update-department/update-department.command-handler';
import { DeleteDepartmentCommand } from '@/modules/organization/department/application/commands/delete-department/delete-department.command';
import { DeleteDepartmentCommandHandler } from '@/modules/organization/department/application/commands/delete-department/delete-department.command-handler';
import { FindDepartmentQuery } from '@/modules/organization/department/application/queries/find-department/find-department.query';
import { FindDepartmentQueryHandler } from '@/modules/organization/department/application/queries/find-department/find-department.query-handler';
import { FindDepartmentsQuery } from '@/modules/organization/department/application/queries/find-departments/find-departments.query';
import { FindDepartmentsQueryHandler } from '@/modules/organization/department/application/queries/find-departments/find-departments.query-handler';

/**
 * Интеграционный тест проверяет полный конвейер «CQRS-шина → обработчик →
 * репозиторий → доменная сущность → маппер» на сквозных сценариях, не требуя
 * подключения к реальной базе данных. Хранилище данных эмулируется в памяти.
 */
class InMemoryStore {
  readonly rows = new Map<string, Department>();
}

class InMemoryDepartmentRepository implements DepartmentRepositoryPort {
  constructor(
    private readonly store: InMemoryStore,
    private readonly mapper: DepartmentMapper,
  ) {}

  async save(entity: DepartmentEntity): Promise<void> {
    this.store.rows.set(entity.id, this.mapper.toPersistence(entity));
  }

  async findById(id: string): Promise<Option<DepartmentEntity>> {
    const row = this.store.rows.get(id);
    return row ? Some(this.mapper.toDomain(row)) : None;
  }

  async findByName(name: string): Promise<DepartmentEntity | null> {
    const row = [...this.store.rows.values()].find((r) => r.name === name);
    return row ? this.mapper.toDomain(row) : null;
  }

  async delete(entity: DepartmentEntity): Promise<void> {
    this.store.rows.delete(entity.id);
  }

  async transaction<T>(handler: () => Promise<T>): Promise<T> {
    return handler();
  }
}

describe('Organization module (integration)', () => {
  let app: INestApplication;
  let commandBus: CommandBus;
  let queryBus: QueryBus;
  let store: InMemoryStore;

  beforeAll(async () => {
    store = new InMemoryStore();

    const fakePrisma = {
      client: {
        department: {
          findUnique: async ({ where: { id } }: { where: { id: string } }) =>
            store.rows.get(id) ?? null,
          count: async () => store.rows.size,
          findMany: async ({ take, skip }: { take: number; skip: number }) =>
            [...store.rows.values()].slice(skip, skip + take),
        },
      },
    };

    const moduleRef = await Test.createTestingModule({
      imports: [CqrsModule],
      providers: [
        DepartmentMapper,
        { provide: PrismaService, useValue: fakePrisma },
        {
          provide: DEPARTMENT_REPOSITORY,
          useFactory: (mapper: DepartmentMapper) =>
            new InMemoryDepartmentRepository(store, mapper),
          inject: [DepartmentMapper],
        },
        CreateDepartmentCommandHandler,
        UpdateDepartmentCommandHandler,
        DeleteDepartmentCommandHandler,
        FindDepartmentQueryHandler,
        FindDepartmentsQueryHandler,
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    commandBus = app.get(CommandBus);
    queryBus = app.get(QueryBus);
  });

  afterAll(async () => {
    await app.close();
  });

  it('проходит полный жизненный цикл департамента: создание → чтение → обновление → удаление', async () => {
    // создание
    const id: string = await commandBus.execute(
      new CreateDepartmentCommand({ name: 'Маркетинг' }),
    );
    expect(typeof id).toBe('string');

    // чтение по идентификатору
    const created: Department = await queryBus.execute(
      new FindDepartmentQuery(id),
    );
    expect(created.name).toBe('Маркетинг');

    // присутствие в постраничном списке
    const list: Paginated<Department> = await queryBus.execute(
      new FindDepartmentsQuery({ limit: 20, page: 1 }),
    );
    expect(list.count).toBe(1);

    // обновление
    await commandBus.execute(
      new UpdateDepartmentCommand({ departmentId: id, name: 'Продажи' }),
    );
    const updated: Department = await queryBus.execute(
      new FindDepartmentQuery(id),
    );
    expect(updated.name).toBe('Продажи');

    // удаление
    await commandBus.execute(new DeleteDepartmentCommand({ departmentId: id }));
    const empty: Paginated<Department> = await queryBus.execute(
      new FindDepartmentsQuery({ limit: 20, page: 1 }),
    );
    expect(empty.count).toBe(0);
  });

  it('запрещает создание департамента с дублирующимся именем (409)', async () => {
    await commandBus.execute(new CreateDepartmentCommand({ name: 'Финансы' }));

    await expect(
      commandBus.execute(new CreateDepartmentCommand({ name: 'Финансы' })),
    ).rejects.toMatchObject({
      statusCode: 409,
      code: 'DEPARTMENT_ALREADY_EXISTS',
    });
  });
});
