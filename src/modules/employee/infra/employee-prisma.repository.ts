import { Injectable } from '@nestjs/common';
import { PrismaRepositoryBase } from '@/infra/prisma/prisma.repository.base';
import { EmployeeRepositoryPort } from '@/modules/employee/application/ports/employee.repository.port';
import { EmployeeEntity } from '@/modules/employee/domain/employee.entity';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { EmployeeMapper } from '@/modules/employee/employee.mapper';
import { AggregateId } from '@/libs/ddd/entity.base';
import { None, Option, Some } from 'oxide.ts';

@Injectable()
export class EmployeePrismaRepository
  extends PrismaRepositoryBase
  implements EmployeeRepositoryPort
{
  constructor(
    prismaService: PrismaService,
    private readonly mapper: EmployeeMapper,
  ) {
    super(prismaService);
  }

  async save(entity: EmployeeEntity): Promise<void> {
    const data = this.mapper.toPersistence(entity);
    await this.db.employee.upsert({
      where: { id: data.id },
      create: data,
      update: {
        fullname: data.fullname,
        biography: data.biography,
        employmentDate: data.employmentDate,
        dismissalDate: data.dismissalDate,
        divisionId: data.divisionId,
        positionId: data.positionId,
        avatarId: data.avatarId,
        updatedAt: data.updatedAt,
      },
    });
  }

  async findById(id: AggregateId): Promise<Option<EmployeeEntity>> {
    const record = await this.db.employee.findUnique({ where: { id } });
    return record ? Some(this.mapper.toDomain(record)) : None;
  }

  async findByDivision(divisionId: string): Promise<EmployeeEntity[]> {
    const records = await this.db.employee.findMany({ where: { divisionId } });
    return records.map((r) => this.mapper.toDomain(r));
  }

  async findByPosition(positionId: string): Promise<EmployeeEntity[]> {
    const records = await this.db.employee.findMany({ where: { positionId } });
    return records.map((r) => this.mapper.toDomain(r));
  }

  async delete(entity: EmployeeEntity): Promise<void> {
    await this.db.employee.delete({ where: { id: entity.id } });
  }
}
