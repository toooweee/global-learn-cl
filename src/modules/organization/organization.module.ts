import { Module, Provider } from '@nestjs/common';
import { PrismaModule } from '@/infra/prisma/prisma.module';
import { DEPARTMENT_REPOSITORY } from '@/modules/organization/department/application/ports/department.repository.port';
import { DepartmentPrismaRepository } from '@/modules/organization/department/infra/department-prisma.repository';
import { DepartmentMapper } from '@/modules/organization/department/department.mapper';
import { CreateDepartmentCommandHandler } from '@/modules/organization/department/application/commands/create-department/create-department.command-handler';
import { UpdateDepartmentCommandHandler } from '@/modules/organization/department/application/commands/update-department/update-department.command-handler';
import { DeleteDepartmentCommandHandler } from '@/modules/organization/department/application/commands/delete-department/delete-department.command-handler';
import { FindDepartmentQueryHandler } from '@/modules/organization/department/application/queries/find-department/find-department.query-handler';
import { FindDepartmentsQueryHandler } from '@/modules/organization/department/application/queries/find-departments/find-departments.query-handler';
import { DepartmentController } from '@/modules/organization/department/presentation/department.controller';
import { DIVISION_REPOSITORY } from '@/modules/organization/division/application/ports/division.repository.port';
import { DivisionPrismaRepository } from '@/modules/organization/division/infra/division-prisma.repository';
import { DivisionMapper } from '@/modules/organization/division/division.mapper';
import { CreateDivisionCommandHandler } from '@/modules/organization/division/application/commands/create-division/create-division.command-handler';
import { UpdateDivisionCommandHandler } from '@/modules/organization/division/application/commands/update-division/update-division.command-handler';
import { DeleteDivisionCommandHandler } from '@/modules/organization/division/application/commands/delete-division/delete-division.command-handler';
import { FindDivisionQueryHandler } from '@/modules/organization/division/application/queries/find-division/find-division.query-handler';
import { FindDivisionsQueryHandler } from '@/modules/organization/division/application/queries/find-divisions/find-divisions.query-handler';
import { DivisionController } from '@/modules/organization/division/presentation/division.controller';
import { POSITION_REPOSITORY } from '@/modules/organization/position/application/ports/position.repository.port';
import { PositionPrismaRepository } from '@/modules/organization/position/infra/position-prisma.repository';
import { PositionMapper } from '@/modules/organization/position/position.mapper';
import { CreatePositionCommandHandler } from '@/modules/organization/position/application/commands/create-position/create-position.command-handler';
import { UpdatePositionCommandHandler } from '@/modules/organization/position/application/commands/update-position/update-position.command-handler';
import { DeletePositionCommandHandler } from '@/modules/organization/position/application/commands/delete-position/delete-position.command-handler';
import { FindPositionQueryHandler } from '@/modules/organization/position/application/queries/find-position/find-position.query-handler';
import { FindPositionsQueryHandler } from '@/modules/organization/position/application/queries/find-positions/find-positions.query-handler';
import { GetPositionTreeQueryHandler } from '@/modules/organization/position/application/queries/get-position-tree/get-position-tree.query-handler';
import { PositionController } from '@/modules/organization/position/presentation/position.controller';

const repositories: Provider[] = [
  { provide: DEPARTMENT_REPOSITORY, useClass: DepartmentPrismaRepository },
  { provide: DIVISION_REPOSITORY, useClass: DivisionPrismaRepository },
  { provide: POSITION_REPOSITORY, useClass: PositionPrismaRepository },
];

const commandHandlers: Provider[] = [
  CreateDepartmentCommandHandler,
  UpdateDepartmentCommandHandler,
  DeleteDepartmentCommandHandler,
  CreateDivisionCommandHandler,
  UpdateDivisionCommandHandler,
  DeleteDivisionCommandHandler,
  CreatePositionCommandHandler,
  UpdatePositionCommandHandler,
  DeletePositionCommandHandler,
];

const queryHandlers: Provider[] = [
  FindDepartmentQueryHandler,
  FindDepartmentsQueryHandler,
  FindDivisionQueryHandler,
  FindDivisionsQueryHandler,
  FindPositionQueryHandler,
  FindPositionsQueryHandler,
  GetPositionTreeQueryHandler,
];

@Module({
  imports: [PrismaModule],
  controllers: [DepartmentController, DivisionController, PositionController],
  providers: [
    ...repositories,
    ...commandHandlers,
    ...queryHandlers,
    DepartmentMapper,
    DivisionMapper,
    PositionMapper,
  ],
  exports: [DIVISION_REPOSITORY, POSITION_REPOSITORY],
})
export class OrganizationModule {}
