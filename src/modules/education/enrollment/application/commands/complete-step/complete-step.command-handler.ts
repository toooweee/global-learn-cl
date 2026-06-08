import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ApplicationException } from '@/libs/application/exceptions/application.exception';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { CompleteStepCommand } from './complete-step.command';
import {
  ENROLLMENT_REPOSITORY,
  type EnrollmentRepositoryPort,
} from '@/modules/education/enrollment/application/ports/enrollment.repository.port';

@CommandHandler(CompleteStepCommand)
export class CompleteStepCommandHandler implements ICommandHandler<
  CompleteStepCommand,
  void
> {
  constructor(
    @Inject(ENROLLMENT_REPOSITORY)
    private readonly repository: EnrollmentRepositoryPort,
    private readonly prismaService: PrismaService,
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
  }
}
