import { Inject, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/infra/prisma/prisma.service';
import {
  FILE_STORAGE,
  type FileStoragePort,
} from '@/libs/application/ports/file-storage.port';
import { CertificatePdfService } from './certificate-pdf.service';

@Injectable()
export class CertificateIssuerService {
  private readonly logger = new Logger(CertificateIssuerService.name);

  constructor(
    private readonly prismaService: PrismaService,
    @Inject(FILE_STORAGE)
    private readonly fileStorage: FileStoragePort,
    private readonly pdfService: CertificatePdfService,
  ) {}

  /**
   * Generate the certificate PDF, store it in object storage and link it to the
   * certificate via file_id. Best-effort: a storage/render failure is logged but
   * never propagated — the certificate record still exists and stays verifiable.
   */
  async issuePdf(certificateId: string): Promise<void> {
    try {
      const cert = await this.prismaService.client.courseCertificate.findUnique(
        {
          where: { id: certificateId },
          include: {
            employee: { select: { fullname: true } },
            course: { select: { name: true } },
          },
        },
      );

      // Skip if it is gone or already has a PDF.
      if (!cert || cert.fileId) return;

      const buffer = await this.pdfService.generate({
        certificateId: cert.id,
        employeeName: cert.employee.fullname,
        courseName: cert.course.name,
        issuedAt: cert.issuedAt,
      });

      const publicUrl = await this.fileStorage.upload(
        buffer,
        `certificate-${cert.id}.pdf`,
        'application/pdf',
      );

      const file = await this.prismaService.client.file.create({
        data: { url: publicUrl },
      });

      await this.prismaService.client.courseCertificate.update({
        where: { id: cert.id },
        data: { fileId: file.id },
      });
    } catch (error) {
      this.logger.error(
        `Failed to issue PDF for certificate ${certificateId}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}
