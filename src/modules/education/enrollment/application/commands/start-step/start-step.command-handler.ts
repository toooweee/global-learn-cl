import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ApplicationException } from '@/libs/application/exceptions/application.exception';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { StartStepCommand } from './start-step.command';
import {
  ENROLLMENT_REPOSITORY,
  type EnrollmentRepositoryPort,
} from '@/modules/education/enrollment/application/ports/enrollment.repository.port';

@CommandHandler(StartStepCommand)
export class StartStepCommandHandler implements ICommandHandler<
  StartStepCommand,
  void
> {
  constructor(
    @Inject(ENROLLMENT_REPOSITORY)
    private readonly repository: EnrollmentRepositoryPort,
    private readonly prismaService: PrismaService,
  ) {}

  async execute(command: StartStepCommand): Promise<void> {
    const option = await this.repository.findById(command.enrollmentId);
    if (option.isNone()) {
      throw new ApplicationException(
        'Enrollment not found',
        404,
        'ENROLLMENT_NOT_FOUND',
      );
    }

    const enrollment = option.unwrap();

    const step = await this.prismaService.client.step.findUnique({
      where: { id: command.stepId },
      select: { position: true, moduleId: true },
    });
    if (!step) {
      throw new ApplicationException('Step not found', 404, 'STEP_NOT_FOUND');
    }

    if (step.position > 1) {
      const previousSteps = await this.prismaService.client.step.findMany({
        where: { moduleId: step.moduleId, position: { lt: step.position } },
        select: { id: true },
      });
      const completedIds = new Set(
        enrollment
          .getProps()
          .progress.filter((p) => p.completedAt)
          .map((p) => p.stepId),
      );
      const allPreviousDone = previousSteps.every((s) =>
        completedIds.has(s.id),
      );
      if (!allPreviousDone) {
        throw new ApplicationException(
          'Previous steps in this module must be completed before starting this step',
          409,
          'STEP_ORDER_VIOLATION',
        );
      }
    }

    enrollment.startStep(command.stepId);
    await this.repository.save(enrollment);
  }
}
