import { Body, Controller, Post } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateUserRequestDto } from '@/modules/identity/user/presentation/dto/create-user.request.dto';
import { CreateUserCommand } from '@/modules/identity/user/application/commands/create-user/create-user.command';
import { AggregateId } from '@/libs/ddd/entity.base';
import { IdResponseDto } from '@/libs/api/dto';
import {
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOperation,
} from '@nestjs/swagger';

@Controller('user')
export class UserController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @ApiOperation({
    summary: 'Create a user',
  })
  @ApiCreatedResponse({ type: IdResponseDto })
  @ApiConflictResponse({})
  @Post()
  async create(@Body() body: CreateUserRequestDto) {
    const userId = await this.commandBus.execute<
      CreateUserCommand,
      AggregateId
    >(new CreateUserCommand(body));

    return new IdResponseDto(userId);
  }
}
