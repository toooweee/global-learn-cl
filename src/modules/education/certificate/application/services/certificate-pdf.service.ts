import { Injectable } from '@nestjs/common';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import PDFDocument from 'pdfkit';

export interface CertificatePdfData {
  certificateId: string;
  employeeName: string;
  courseName: string;
  issuedAt: Date;
}

// DejaVu Sans is bundled (the built-in PDF fonts have no Cyrillic glyphs).
// nest-cli copies the .ttf assets next to the compiled code; the cwd-based
// candidates cover ts-node/dev and any rootDir layout difference.
const ASSET_REL = ['modules', 'education', 'certificate', 'assets', 'fonts'];
function resolveFontDir(): string {
  const candidates = [
    join(__dirname, '..', '..', 'assets', 'fonts'),
    join(process.cwd(), 'dist', 'src', ...ASSET_REL),
    join(process.cwd(), 'src', ...ASSET_REL),
  ];
  return (
    candidates.find((dir) => existsSync(join(dir, 'DejaVuSans.ttf'))) ??
    candidates[0]
  );
}

const FONT_DIR = resolveFontDir();
const FONT_REGULAR = join(FONT_DIR, 'DejaVuSans.ttf');
const FONT_BOLD = join(FONT_DIR, 'DejaVuSans-Bold.ttf');

@Injectable()
export class CertificatePdfService {
  /** Render a landscape A4 completion certificate as a PDF buffer. */
  generate(data: CertificatePdfData): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        layout: 'landscape',
        margin: 60,
      });

      const chunks: Buffer[] = [];
      doc.on('data', (c: Buffer) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.registerFont('regular', FONT_REGULAR);
      doc.registerFont('bold', FONT_BOLD);

      const { width, height } = doc.page;

      doc
        .lineWidth(3)
        .strokeColor('#1d4ed8')
        .rect(28, 28, width - 56, height - 56)
        .stroke();

      doc
        .font('bold')
        .fontSize(42)
        .fillColor('#111827')
        .text('СЕРТИФИКАТ', 0, 120, { align: 'center' });

      doc
        .font('regular')
        .fontSize(15)
        .fillColor('#6b7280')
        .text('подтверждает успешное прохождение курса', { align: 'center' });

      doc.moveDown(2);
      doc
        .font('bold')
        .fontSize(30)
        .fillColor('#1d4ed8')
        .text(data.employeeName, { align: 'center' });

      doc.moveDown(0.6);
      doc
        .font('regular')
        .fontSize(17)
        .fillColor('#374151')
        .text('завершил(а) курс', { align: 'center' });

      doc.moveDown(0.4);
      doc
        .font('bold')
        .fontSize(22)
        .fillColor('#111827')
        .text(`«${data.courseName}»`, { align: 'center' });

      const issued = data.issuedAt.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });

      doc
        .font('regular')
        .fontSize(12)
        .fillColor('#6b7280')
        .text(`Дата выдачи: ${issued}`, 60, height - 120)
        .text(`ID сертификата: ${data.certificateId}`);

      doc.end();
    });
  }
}
