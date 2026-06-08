import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ApplicationException } from '@/libs/application/exceptions/application.exception';
import { RequestContextService } from '@/libs/application/context/app-request-context';
import { IdResponseDto } from '@/libs/api/dto';
import { TestAttemptEntity } from '@/modules/education/test-attempt/domain/test-attempt.entity';
import { StartTestAttemptCommand } from './start-test-attempt.command';
import {
  TEST_ATTEMPT_REPOSITORY,
  type TestAttemptRepositoryPort,
} from '@/modules/education/test-attempt/application/ports/test-attempt.repository.port';

@CommandHandler(StartTestAttemptCommand)
export class StartTestAttemptCommandHandler implements ICommandHandler<
  StartTestAttemptCommand,
  IdResponseDto
> {
  constructor(
    @Inject(TEST_ATTEMPT_REPOSITORY)
    private readonly repository: TestAttemptRepositoryPort,
  ) {}

  async execute(command: StartTestAttemptCommand): Promise<IdResponseDto> {
    const employeeId = RequestContextService.getUserId();
    if (!employeeId) {
      throw new ApplicationException('Unauthorized', 401, 'UNAUTHORIZED');
    }

    const attempt = TestAttemptEntity.create({
      testId: command.testId,
      employeeId,
    });
    await this.repository.save(attempt);
    return new IdResponseDto(attempt.id);
  }
}
