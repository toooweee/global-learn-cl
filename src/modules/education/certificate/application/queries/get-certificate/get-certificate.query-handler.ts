import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ApplicationException } from '@/libs/application/exceptions/application.exception';
import { PrismaService } from '@/infra/prisma/prisma.service';
import {
  FILE_STORAGE,
  type FileStoragePort,
} from '@/libs/application/ports/file-storage.port';
import { CertificateResponseDto } from '@/modules/education/certificate/presentation/dto/certificate.response.dto';
import { GetCertificateQuery } from './get-certificate.query';

@QueryHandler(GetCertificateQuery)
export class GetCertificateQueryHandler implements IQueryHandler<
  GetCertificateQuery,
  CertificateResponseDto
> {
  constructor(
    private readonly prismaService: PrismaService,
    @Inject(FILE_STORAGE)
    private readonly fileStorage: FileStoragePort,
  ) {}

  async execute(query: GetCertificateQuery): Promise<CertificateResponseDto> {
    const cert = await this.prismaService.client.courseCertificate.findUnique({
      where: { id: query.certificateId },
      include: {
        employee: { select: { fullname: true } },
        course: { select: { name: true } },
        file: { select: { url: true } },
      },
    });

    if (!cert) {
      throw new ApplicationException(
        'Certificate not found',
        404,
        'CERTIFICATE_NOT_FOUND',
      );
    }

    const fileUrl = cert.file
      ? await this.fileStorage.getSignedUrl(cert.file.url)
      : undefined;

    return new CertificateResponseDto({
      id: cert.id,
      enrollmentId: cert.enrollmentId,
      employeeId: cert.employeeId,
      employeeName: cert.employee.fullname,
      courseId: cert.courseId,
      courseName: cert.course.name,
      issuedAt: cert.issuedAt,
      fileUrl,
    });
  }
}
