import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ApplicationException } from '@/libs/application/exceptions/application.exception';
import { RequestContextService } from '@/libs/application/context/app-request-context';
import {
  COURSE_ASSIGNER_ROLES,
  type AppRole,
} from '@/libs/auth/roles.constants';
import { CancelEnrollmentCommand } from './cancel-enrollment.command';
import {
  ENROLLMENT_REPOSITORY,
  type EnrollmentRepositoryPort,
} from '@/modules/education/enrollment/application/ports/enrollment.repository.port';

@CommandHandler(CancelEnrollmentCommand)
export class CancelEnrollmentCommandHandler implements ICommandHandler<
  CancelEnrollmentCommand,
  void
> {
  constructor(
    @Inject(ENROLLMENT_REPOSITORY)
    private readonly repository: EnrollmentRepositoryPort,
  ) {}

  async execute(command: CancelEnrollmentCommand): Promise<void> {
    const option = await this.repository.findById(command.enrollmentId);
    if (option.isNone()) {
      throw new ApplicationException(
        'Enrollment not found',
        404,
        'ENROLLMENT_NOT_FOUND',
      );
    }

    const enrollment = option.unwrap();

    // Only the enrolled employee or a manager may cancel an enrollment.
    const userId = RequestContextService.getUserId();
    const role = RequestContextService.getUserRole() as AppRole | undefined;
    const isManager = !!role && COURSE_ASSIGNER_ROLES.includes(role);
    if (enrollment.getProps().employeeId !== userId && !isManager) {
      throw new ApplicationException(
        'You can only cancel your own enrollment',
        403,
        'FORBIDDEN',
      );
    }

    enrollment.cancel();
    await this.repository.save(enrollment);
  }
}
