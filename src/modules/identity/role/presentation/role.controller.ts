import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '@/libs/auth/decorators/roles.decorator';
import { IdResponseDto, PaginatedResponseDto } from '@/libs/api/dto';
import { IdRequestDto } from '@/libs/api/dto/id.request.dto';
import { PaginatedQueryRequestDto } from '@/libs/api/dto/paginated.query.request.dto';
import { ApiPaginatedResponse } from '@/libs/api/decorators/api-paginated-response.decorator';
import { Paginated } from '@/libs/application';
import { Role } from '@generated/client';
import { CreateRoleRequestDto } from '@/modules/identity/role/presentation/dto/create-role.request.dto';
import { RoleResponseDto } from '@/modules/identity/role/presentation/dto/role.response.dto';
import { CreateRoleCommand } from '@/modules/identity/role/application/commands/create-role/create-role.command';
import { DeleteRoleCommand } from '@/modules/identity/role/application/commands/delete-role/delete-role.command';
import { FindRoleQuery } from '@/modules/identity/role/application/queries/find-role/find-role.query';
import { FindRolesQuery } from '@/modules/identity/role/application/queries/find-roles/find-roles.query';

@ApiTags('roles')
@Controller('roles')
export class RoleController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @ApiOperation({ summary: 'Create role (Admin only)' })
  @ApiCreatedResponse({ type: IdResponseDto })
  @Roles('Admin')
  @Post()
  async create(@Body() body: CreateRoleRequestDto): Promise<IdResponseDto> {
    const id = await this.commandBus.execute<CreateRoleCommand, string>(
      new CreateRoleCommand({ name: body.name }),
    );
    return new IdResponseDto(id);
  }

  @ApiOperation({ summary: 'List roles' })
  @ApiPaginatedResponse(RoleResponseDto)
  @Get()
  async findAll(
    @Query() query: PaginatedQueryRequestDto,
  ): Promise<PaginatedResponseDto<RoleResponseDto>> {
    const result = await this.queryBus.execute<FindRolesQuery, Paginated<Role>>(
      new FindRolesQuery({ limit: query.limit, page: query.page }),
    );
    return new PaginatedResponseDto<RoleResponseDto>({
      count: result.count,
      limit: result.limit,
      page: result.page,
      data: result.data.map((r) => new RoleResponseDto(r)),
    });
  }

  @ApiOperation({ summary: 'Get role by id' })
  @ApiOkResponse({ type: RoleResponseDto })
  @ApiNotFoundResponse()
  @Get(':id')
  async findOne(@Param() params: IdRequestDto): Promise<RoleResponseDto> {
    const record = await this.queryBus.execute<FindRoleQuery, Role>(
      new FindRoleQuery(params.id),
    );
    return new RoleResponseDto(record);
  }

  @ApiOperation({ summary: 'Delete role (Admin only)' })
  @ApiOkResponse()
  @ApiNotFoundResponse()
  @Roles('Admin')
  @Delete(':id')
  async remove(@Param() params: IdRequestDto): Promise<void> {
    await this.commandBus.execute<DeleteRoleCommand, void>(
      new DeleteRoleCommand({ roleId: params.id }),
    );
  }
}
