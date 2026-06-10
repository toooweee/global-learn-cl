import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ApplicationException } from '@/libs/application/exceptions/application.exception';
import { RequestContextService } from '@/libs/application/context/app-request-context';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { CertificateResponseDto } from '@/modules/education/certificate/presentation/dto/certificate.response.dto';
import { GetMyCertificatesQuery } from './get-my-certificates.query';

@QueryHandler(GetMyCertificatesQuery)
export class GetMyCertificatesQueryHandler implements IQueryHandler<
  GetMyCertificatesQuery,
  CertificateResponseDto[]
> {
  constructor(private readonly prismaService: PrismaService) {}

  async execute(): Promise<CertificateResponseDto[]> {
    const employeeId = RequestContextService.getUserId();
    if (!employeeId) {
      throw new ApplicationException('Unauthorized', 401, 'UNAUTHORIZED');
    }

    const certs = await this.prismaService.client.courseCertificate.findMany({
      where: { employeeId },
      include: {
        employee: { select: { fullname: true } },
        course: { select: { name: true } },
      },
      orderBy: { issuedAt: 'desc' },
    });

    return certs.map(
      (c) =>
        new CertificateResponseDto({
          id: c.id,
          enrollmentId: c.enrollmentId,
          employeeId: c.employeeId,
          employeeName: c.employee.fullname,
          courseId: c.courseId,
          courseName: c.course.name,
          issuedAt: c.issuedAt,
        }),
    );
  }
}
