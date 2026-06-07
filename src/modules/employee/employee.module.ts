import { Module, Provider } from '@nestjs/common';
import { PrismaModule } from '@/infra/prisma/prisma.module';
import { CryptoModule } from '@/libs/crypto/crypto.module';
import { UserModule } from '@/modules/identity/user/user.module';
import { EMPLOYEE_REPOSITORY } from '@/modules/employee/application/ports/employee.repository.port';
import { EmployeePrismaRepository } from '@/modules/employee/infra/employee-prisma.repository';
import { EmployeeMapper } from '@/modules/employee/employee.mapper';
import { CreateEmployeeCommandHandler } from '@/modules/employee/application/create-employee/create-employee.command-handler';
import { UpdateEmployeeCommandHandler } from '@/modules/employee/application/update-employee/update-employee.command-handler';
import { DeleteEmployeeCommandHandler } from '@/modules/employee/application/delete-employee/delete-employee.command-handler';
import { PromoteEmployeeCommandHandler } from '@/modules/employee/application/promote-employee/promote-employee.command-handler';
import { FindEmployeeQueryHandler } from '@/modules/employee/application/queries/find-employee/find-employee.query-handler';
import { FindEmployeesQueryHandler } from '@/modules/employee/application/queries/find-employees/find-employees.query-handler';
import { FindMySubordinatesQueryHandler } from '@/modules/employee/application/queries/find-my-subordinates/find-my-subordinates.query-handler';
import { EmployeeController } from '@/modules/employee/presentation/employee.controller';

const repositories: Provider[] = [
  { provide: EMPLOYEE_REPOSITORY, useClass: EmployeePrismaRepository },
];

const commandHandlers: Provider[] = [
  CreateEmployeeCommandHandler,
  UpdateEmployeeCommandHandler,
  DeleteEmployeeCommandHandler,
  PromoteEmployeeCommandHandler,
];

const queryHandlers: Provider[] = [
  FindEmployeeQueryHandler,
  FindEmployeesQueryHandler,
  FindMySubordinatesQueryHandler,
];

@Module({
  imports: [PrismaModule, CryptoModule, UserModule],
  controllers: [EmployeeController],
  providers: [
    ...repositories,
    ...commandHandlers,
    ...queryHandlers,
    EmployeeMapper,
  ],
  exports: [EMPLOYEE_REPOSITORY],
})
export class EmployeeModule {}
