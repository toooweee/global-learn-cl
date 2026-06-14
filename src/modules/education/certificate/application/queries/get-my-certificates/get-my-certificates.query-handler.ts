import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ApplicationException } from '@/libs/application/exceptions/application.exception';
import { RequestContextService } from '@/libs/application/context/app-request-context';
import { PrismaService } from '@/infra/prisma/prisma.service';
import {
  FILE_STORAGE,
  type FileStoragePort,
} from '@/libs/application/ports/file-storage.port';
import { CertificateResponseDto } from '@/modules/education/certificate/presentation/dto/certificate.response.dto';
import { GetMyCertificatesQuery } from './get-my-certificates.query';

@QueryHandler(GetMyCertificatesQuery)
export class GetMyCertificatesQueryHandler implements IQueryHandler<
  GetMyCertificatesQuery,
  CertificateResponseDto[]
> {
  constructor(
    private readonly prismaService: PrismaService,
    @Inject(FILE_STORAGE)
    private readonly fileStorage: FileStoragePort,
  ) {}

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
        file: { select: { url: true } },
      },
      orderBy: { issuedAt: 'desc' },
    });

    return Promise.all(
      certs.map(async (c) => {
        const fileUrl = c.file
          ? await this.fileStorage.getSignedUrl(c.file.url)
          : undefined;
        return new CertificateResponseDto({
          id: c.id,
          enrollmentId: c.enrollmentId,
          employeeId: c.employeeId,
          employeeName: c.employee.fullname,
          courseId: c.courseId,
          courseName: c.course.name,
          issuedAt: c.issuedAt,
          fileUrl,
        });
      }),
    );
  }
}
