import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ApplicationException } from '@/libs/application/exceptions/application.exception';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { CertificateResponseDto } from '@/modules/education/certificate/presentation/dto/certificate.response.dto';
import { GetCertificateQuery } from './get-certificate.query';

@QueryHandler(GetCertificateQuery)
export class GetCertificateQueryHandler implements IQueryHandler<
  GetCertificateQuery,
  CertificateResponseDto
> {
  constructor(private readonly prismaService: PrismaService) {}

  async execute(query: GetCertificateQuery): Promise<CertificateResponseDto> {
    const cert = await this.prismaService.client.courseCertificate.findUnique({
      where: { id: query.certificateId },
      include: {
        employee: { select: { fullname: true } },
        course: { select: { name: true } },
      },
    });

    if (!cert) {
      throw new ApplicationException(
        'Certificate not found',
        404,
        'CERTIFICATE_NOT_FOUND',
      );
    }

    return new CertificateResponseDto({
      id: cert.id,
      enrollmentId: cert.enrollmentId,
      employeeId: cert.employeeId,
      employeeName: cert.employee.fullname,
      courseId: cert.courseId,
      courseName: cert.course.name,
      issuedAt: cert.issuedAt,
    });
  }
}
