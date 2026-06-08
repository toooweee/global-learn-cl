import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ApplicationException } from '@/libs/application/exceptions/application.exception';
import { IdResponseDto } from '@/libs/api/dto';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { EnrollmentEntity } from '@/modules/education/enrollment/domain/enrollment.entity';
import { CreateEnrollmentCommand } from './create-enrollment.command';
import {
  ENROLLMENT_REPOSITORY,
  type EnrollmentRepositoryPort,
} from '@/modules/education/enrollment/application/ports/enrollment.repository.port';

@CommandHandler(CreateEnrollmentCommand)
export class CreateEnrollmentCommandHandler implements ICommandHandler<
  CreateEnrollmentCommand,
  IdResponseDto
> {
  constructor(
    @Inject(ENROLLMENT_REPOSITORY)
    private readonly repository: EnrollmentRepositoryPort,
    private readonly prismaService: PrismaService,
  ) {}

  async execute(command: CreateEnrollmentCommand): Promise<IdResponseDto> {
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
      throw new ApplicationException(
        'Course not found',
        404,
        'COURSE_NOT_FOUND',
      );
    }
    if (course.isArchived) {
      throw new ApplicationException(
        'Cannot enroll in an archived course',
        409,
        'COURSE_ARCHIVED',
      );
    }

    await this.checkScopeAccess(course, command.employeeId);

    const existing = await this.repository.findByCourseAndEmployee(
      command.courseId,
      command.employeeId,
    );

    if (existing.isSome()) {
      const enrollment = existing.unwrap();
      const props = enrollment.getProps();

      if (props.status !== 'CANCELLED') {
        throw new ApplicationException(
          'Enrollment already exists',
          409,
          'ENROLLMENT_ALREADY_EXISTS',
        );
      }

      await this.repository.clearProgress(enrollment.id);
      enrollment.reactivate();
      await this.repository.save(enrollment);
      return new IdResponseDto(enrollment.id);
    }

    const enrollment = EnrollmentEntity.create({
      courseId: command.courseId,
      employeeId: command.employeeId,
      assignedById: command.assignedById,
    });

    await this.repository.save(enrollment);
    return new IdResponseDto(enrollment.id);
  }

  private async checkScopeAccess(
    course: {
      scope: string;
      departmentId: string | null;
      divisionId: string | null;
    },
    employeeId: string,
  ): Promise<void> {
    if (course.scope === 'ALL') return;

    const employee = await this.prismaService.client.employee.findUnique({
      where: { id: employeeId },
      select: {
        divisionId: true,
        division: { select: { departmentId: true } },
      },
    });
    if (!employee) {
      throw new ApplicationException(
        'Employee not found',
        404,
        'EMPLOYEE_NOT_FOUND',
      );
    }

    if (
      course.scope === 'DEPARTMENT' &&
      employee.division?.departmentId !== course.departmentId
    ) {
      throw new ApplicationException(
        'Employee does not belong to the department this course is restricted to',
        403,
        'COURSE_SCOPE_FORBIDDEN',
      );
    }

    if (
      course.scope === 'DIVISION' &&
      employee.divisionId !== course.divisionId
    ) {
      throw new ApplicationException(
        'Employee does not belong to the division this course is restricted to',
        403,
        'COURSE_SCOPE_FORBIDDEN',
      );
    }
  }
}
