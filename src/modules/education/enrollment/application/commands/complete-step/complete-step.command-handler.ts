import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ApplicationException } from '@/libs/application/exceptions/application.exception';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { EnrollmentStatus } from '@generated/client';
import { CompleteStepCommand } from './complete-step.command';
import {
  ENROLLMENT_REPOSITORY,
  type EnrollmentRepositoryPort,
} from '@/modules/education/enrollment/application/ports/enrollment.repository.port';
import { CertificateIssuerService } from '@/modules/education/certificate/application/services/certificate-issuer.service';

@CommandHandler(CompleteStepCommand)
export class CompleteStepCommandHandler implements ICommandHandler<
  CompleteStepCommand,
  void
> {
  constructor(
    @Inject(ENROLLMENT_REPOSITORY)
    private readonly repository: EnrollmentRepositoryPort,
    private readonly prismaService: PrismaService,
    private readonly certificateIssuer: CertificateIssuerService,
  ) {}

  async execute(command: CompleteStepCommand): Promise<void> {
    const option = await this.repository.findById(command.enrollmentId);
    if (option.isNone()) {
      throw new ApplicationException(
        'Enrollment not found',
        404,
        'ENROLLMENT_NOT_FOUND',
      );
    }

    const enrollment = option.unwrap();
    enrollment.completeStep(command.stepId);

    const props = enrollment.getProps();
    const totalSteps = await this.prismaService.client.step.count({
      where: { module: { courseId: props.courseId } },
    });

    const completedSteps = props.progress.filter((p) => p.completedAt).length;
    if (totalSteps > 0 && completedSteps >= totalSteps) {
      enrollment.markCompleted();
    }

    await this.repository.save(enrollment);

    // Auto-issue certificate when course is completed
    if (enrollment.getProps().status === EnrollmentStatus.COMPLETED) {
      const completedAt = enrollment.getProps().completedAt ?? new Date();
      const certificate =
        await this.prismaService.client.courseCertificate.upsert({
          where: { enrollmentId: enrollment.id },
          create: {
            enrollmentId: enrollment.id,
            employeeId: props.employeeId,
            courseId: props.courseId,
            issuedAt: completedAt,
          },
          update: {},
        });

      // Render + store the PDF and link it (best-effort, never fails completion).
      await this.certificateIssuer.issuePdf(certificate.id);
    }
  }
}
