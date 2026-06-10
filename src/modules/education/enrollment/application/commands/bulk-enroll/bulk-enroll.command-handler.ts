import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { EnrollmentEntity } from '@/modules/education/enrollment/domain/enrollment.entity';
import { BulkEnrollCommand } from './bulk-enroll.command';
import {
  ENROLLMENT_REPOSITORY,
  type EnrollmentRepositoryPort,
} from '@/modules/education/enrollment/application/ports/enrollment.repository.port';
import { BulkEnrollResponseDto } from '@/modules/education/enrollment/presentation/dto/bulk-enroll.response.dto';

@CommandHandler(BulkEnrollCommand)
export class BulkEnrollCommandHandler implements ICommandHandler<
  BulkEnrollCommand,
  BulkEnrollResponseDto
> {
  constructor(
    @Inject(ENROLLMENT_REPOSITORY)
    private readonly repository: EnrollmentRepositoryPort,
    private readonly prismaService: PrismaService,
  ) {}

  async execute(command: BulkEnrollCommand): Promise<BulkEnrollResponseDto> {
    const course = await this.prismaService.client.course.findUnique({
      where: { id: command.courseId },
      select: {
        id: true,
        scope: true,
        departmentId: true,
        divisionId: true,
        isArchived: true,
      },
    });

    if (!course) {
      return new BulkEnrollResponseDto({
        enrolled: [],
        alreadyEnrolled: [],
        failed: command.employeeIds.map((id) => ({
          employeeId: id,
          reason: 'COURSE_NOT_FOUND',
        })),
      });
    }

    if (course.isArchived) {
      return new BulkEnrollResponseDto({
        enrolled: [],
        alreadyEnrolled: [],
        failed: command.employeeIds.map((id) => ({
          employeeId: id,
          reason: 'COURSE_ARCHIVED',
        })),
      });
    }

    const enrolled: string[] = [];
    const alreadyEnrolled: string[] = [];
    const failed: { employeeId: string; reason: string }[] = [];

    await Promise.all(
      command.employeeIds.map(async (employeeId) => {
        try {
          if (course.scope !== 'ALL') {
            const employee =
              await this.prismaService.client.employee.findUnique({
                where: { id: employeeId },
                select: {
                  divisionId: true,
                  division: { select: { departmentId: true } },
                },
              });
            if (!employee) {
              failed.push({ employeeId, reason: 'EMPLOYEE_NOT_FOUND' });
              return;
            }
            if (
              course.scope === 'DEPARTMENT' &&
              employee.division?.departmentId !== course.departmentId
            ) {
              failed.push({ employeeId, reason: 'COURSE_SCOPE_FORBIDDEN' });
              return;
            }
            if (
              course.scope === 'DIVISION' &&
              employee.divisionId !== course.divisionId
            ) {
              failed.push({ employeeId, reason: 'COURSE_SCOPE_FORBIDDEN' });
              return;
            }
          }

          const existing = await this.repository.findByCourseAndEmployee(
            command.courseId,
            employeeId,
          );

          if (existing.isSome()) {
            const props = existing.unwrap().getProps();
            if (props.status !== 'CANCELLED') {
              alreadyEnrolled.push(employeeId);
              return;
            }
            await this.repository.clearProgress(existing.unwrap().id);
            existing.unwrap().reactivate();
            await this.repository.save(existing.unwrap());
            enrolled.push(employeeId);
            return;
          }

          const entity = EnrollmentEntity.create({
            courseId: command.courseId,
            employeeId,
            assignedById: command.assignedById,
          });
          await this.repository.save(entity);
          enrolled.push(employeeId);
        } catch {
          failed.push({ employeeId, reason: 'INTERNAL_ERROR' });
        }
      }),
    );

    return new BulkEnrollResponseDto({ enrolled, alreadyEnrolled, failed });
  }
}
