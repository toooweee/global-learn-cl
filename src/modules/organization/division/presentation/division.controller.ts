import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
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
import { Division } from '@generated/client';
import { CreateDivisionRequestDto } from '@/modules/organization/division/presentation/dto/create-division.request.dto';
import { UpdateDivisionRequestDto } from '@/modules/organization/division/presentation/dto/update-division.request.dto';
import { DivisionResponseDto } from '@/modules/organization/division/presentation/dto/division.response.dto';
import { CreateDivisionCommand } from '@/modules/organization/division/application/commands/create-division/create-division.command';
import { UpdateDivisionCommand } from '@/modules/organization/division/application/commands/update-division/update-division.command';
import { DeleteDivisionCommand } from '@/modules/organization/division/application/commands/delete-division/delete-division.command';
import { FindDivisionQuery } from '@/modules/organization/division/application/queries/find-division/find-division.query';
import { FindDivisionsQuery } from '@/modules/organization/division/application/queries/find-divisions/find-divisions.query';
import { IsOptional, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

class DivisionFilterQueryDto extends PaginatedQueryRequestDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  departmentId?: string;
}

@ApiTags('divisions')
@Controller('divisions')
export class DivisionController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @ApiOperation({ summary: 'Create division (Admin only)' })
  @ApiCreatedResponse({ type: IdResponseDto })
  @Roles('Admin')
  @Post()
  async create(@Body() body: CreateDivisionRequestDto): Promise<IdResponseDto> {
    const id = await this.commandBus.execute<CreateDivisionCommand, string>(
      new CreateDivisionCommand({
        name: body.name,
        departmentId: body.departmentId,
      }),
    );
    return new IdResponseDto(id);
  }

  @ApiOperation({ summary: 'List divisions' })
  @ApiPaginatedResponse(DivisionResponseDto)
  @Get()
  async findAll(
    @Query() query: DivisionFilterQueryDto,
  ): Promise<PaginatedResponseDto<DivisionResponseDto>> {
    const result = await this.queryBus.execute<
      FindDivisionsQuery,
      Paginated<Division>
    >(
      new FindDivisionsQuery({
        limit: query.limit,
        page: query.page,
        departmentId: query.departmentId,
      }),
    );
    return new PaginatedResponseDto<DivisionResponseDto>({
      count: result.count,
      limit: result.limit,
      page: result.page,
      data: result.data.map((d) => new DivisionResponseDto(d)),
    });
  }

  @ApiOperation({ summary: 'Get division by id' })
  @ApiOkResponse({ type: DivisionResponseDto })
  @ApiNotFoundResponse()
  @Get(':id')
  async findOne(@Param() params: IdRequestDto): Promise<DivisionResponseDto> {
    const record = await this.queryBus.execute<FindDivisionQuery, Division>(
      new FindDivisionQuery(params.id),
    );
    return new DivisionResponseDto(record);
  }

  @ApiOperation({ summary: 'Update division (Admin only)' })
  @ApiOkResponse()
  @ApiNotFoundResponse()
  @Roles('Admin')
  @Patch(':id')
  async update(
    @Param() params: IdRequestDto,
    @Body() body: UpdateDivisionRequestDto,
  ): Promise<void> {
    await this.commandBus.execute<UpdateDivisionCommand, void>(
      new UpdateDivisionCommand({
        divisionId: params.id,
        name: body.name,
        departmentId: body.departmentId,
      }),
    );
  }

  @ApiOperation({ summary: 'Delete division (Admin only)' })
  @ApiOkResponse()
  @ApiNotFoundResponse()
  @Roles('Admin')
  @Delete(':id')
  async remove(@Param() params: IdRequestDto): Promise<void> {
    await this.commandBus.execute<DeleteDivisionCommand, void>(
      new DeleteDivisionCommand({ divisionId: params.id }),
    );
  }
}
