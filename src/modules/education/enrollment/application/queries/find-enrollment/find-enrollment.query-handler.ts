import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ApplicationException } from '@/libs/application/exceptions/application.exception';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { enrollmentInclude } from '@/modules/education/enrollment/enrollment.mapper';
import { EnrollmentResponseDto } from '@/modules/education/enrollment/presentation/dto/enrollment.response.dto';
import { FindEnrollmentQuery } from './find-enrollment.query';

@QueryHandler(FindEnrollmentQuery)
export class FindEnrollmentQueryHandler implements IQueryHandler<
  FindEnrollmentQuery,
  EnrollmentResponseDto
> {
  constructor(private readonly prismaService: PrismaService) {}

  async execute(query: FindEnrollmentQuery): Promise<EnrollmentResponseDto> {
    const row = await this.prismaService.client.courseEnrollment.findUnique({
      where: { id: query.enrollmentId },
      include: enrollmentInclude,
    });

    if (!row) {
      throw new ApplicationException(
        'Enrollment not found',
        404,
        'ENROLLMENT_NOT_FOUND',
      );
    }

    return new EnrollmentResponseDto({
      id: row.id,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      courseId: row.courseId,
      employeeId: row.employeeId,
      assignedById: row.assignedById,
      status: row.status,
      startedAt: row.startedAt,
      completedAt: row.completedAt ?? undefined,
      progress: row.progress.map((p) => ({
        id: p.id,
        stepId: p.stepId,
        completedAt: p.completedAt ?? undefined,
        createdAt: p.createdAt,
      })),
    });
  }
}
