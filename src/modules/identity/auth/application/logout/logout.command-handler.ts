import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, Inject } from '@nestjs/common';
import { LogoutCommand } from '@/modules/identity/auth/application/logout/logout.command';
import {
  TOKEN_REPOSITORY,
  type TokenRepositoryPort,
} from '@/modules/identity/token/application/ports/token.repository.port';

@CommandHandler(LogoutCommand)
@Injectable()
export class LogoutCommandHandler implements ICommandHandler<
  LogoutCommand,
  void
> {
  constructor(
    @Inject(TOKEN_REPOSITORY)
    private readonly tokenRepository: TokenRepositoryPort,
  ) {}

  async execute(command: LogoutCommand): Promise<void> {
    await this.tokenRepository.deleteByUserAndAgent(
      command.userId,
      command.userAgent,
    );
  }
}
