import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateUserRequestDto } from '@/modules/identity/user/presentation/dto/create-user.request.dto';
import { CreateUserCommand } from '@/modules/identity/user/application/commands/create-user/create-user.command';
import { AggregateId } from '@/libs/ddd/entity.base';
import { IdResponseDto, PaginatedResponseDto } from '@/libs/api/dto';
import {
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger';
import { FindUserQuery } from '@/modules/identity/user/application/queries/find-user/find-user.query';
import { User } from '@generated/client';
import { UserResponseDto } from '@/modules/identity/user/presentation/dto/user.response.dto';
import { IdRequestDto } from '@/libs/api/dto/id.request.dto';
import { PaginatedQueryRequestDto } from '@/libs/api/dto/paginated.query.request.dto';
import { FindUsersQuery } from '@/modules/identity/user/application/queries/find-users/find-users.query';
import { Paginated } from '@/libs/application';
import { ApiPaginatedResponse } from '@/libs/api/decorators/api-paginated-response.decorator';

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

  @ApiOperation({
    summary: 'Find paginated users',
  })
  @ApiPaginatedResponse(UserResponseDto)
  @Get()
  async findUsers(@Query() query: PaginatedQueryRequestDto) {
    const findUsersQuery = new FindUsersQuery({
      limit: query.limit,
      page: query.page,
    });

    const paginatedUsers = await this.queryBus.execute<
      FindUsersQuery,
      Paginated<User>
    >(findUsersQuery);

    return new PaginatedResponseDto<UserResponseDto>({
      count: paginatedUsers.count,
      limit: paginatedUsers.limit,
      page: paginatedUsers.page,
      data: paginatedUsers.data.map((user) => new UserResponseDto(user)),
    });
  }

  @ApiOperation({
    summary: 'Find user by id',
  })
  @ApiOkResponse({
    type: UserResponseDto,
  })
  @ApiNotFoundResponse()
  @Get(':id')
  async findById(@Param() request: IdRequestDto) {
    const user = await this.queryBus.execute<FindUserQuery, User>(
      new FindUserQuery(request.id),
    );

    return new UserResponseDto(user);
  }
}
