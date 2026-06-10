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
import { Position } from '@generated/client';
import { CreatePositionRequestDto } from '@/modules/organization/position/presentation/dto/create-position.request.dto';
import { UpdatePositionRequestDto } from '@/modules/organization/position/presentation/dto/update-position.request.dto';
import {
  PositionResponseDto,
  PositionTreeDto,
} from '@/modules/organization/position/presentation/dto/position.response.dto';
import { CreatePositionCommand } from '@/modules/organization/position/application/commands/create-position/create-position.command';
import { UpdatePositionCommand } from '@/modules/organization/position/application/commands/update-position/update-position.command';
import { DeletePositionCommand } from '@/modules/organization/position/application/commands/delete-position/delete-position.command';
import { FindPositionQuery } from '@/modules/organization/position/application/queries/find-position/find-position.query';
import { FindPositionsQuery } from '@/modules/organization/position/application/queries/find-positions/find-positions.query';
import { GetPositionTreeQuery } from '@/modules/organization/position/application/queries/get-position-tree/get-position-tree.query';

@ApiTags('positions')
@Controller('positions')
export class PositionController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @ApiOperation({ summary: 'Create position (Admin only)' })
  @ApiCreatedResponse({ type: IdResponseDto })
  @Roles('admin')
  @Post()
  async create(@Body() body: CreatePositionRequestDto): Promise<IdResponseDto> {
    const id = await this.commandBus.execute<CreatePositionCommand, string>(
      new CreatePositionCommand({ name: body.name, parentId: body.parentId }),
    );
    return new IdResponseDto(id);
  }

  @ApiOperation({ summary: 'Get position hierarchy tree' })
  @ApiOkResponse({ type: [PositionTreeDto] })
  @Get('tree')
  async getTree(): Promise<PositionTreeDto[]> {
    return this.queryBus.execute<GetPositionTreeQuery, PositionTreeDto[]>(
      new GetPositionTreeQuery(),
    );
  }

  @ApiOperation({ summary: 'List positions' })
  @ApiPaginatedResponse(PositionResponseDto)
  @Get()
  async findAll(
    @Query() query: PaginatedQueryRequestDto,
  ): Promise<PaginatedResponseDto<PositionResponseDto>> {
    const result = await this.queryBus.execute<
      FindPositionsQuery,
      Paginated<Position>
    >(new FindPositionsQuery({ limit: query.limit, page: query.page }));
    return new PaginatedResponseDto<PositionResponseDto>({
      count: result.count,
      limit: result.limit,
      page: result.page,
      data: result.data.map((p) => new PositionResponseDto(p)),
    });
  }

  @ApiOperation({ summary: 'Get position by id' })
  @ApiOkResponse({ type: PositionResponseDto })
  @ApiNotFoundResponse()
  @Get(':id')
  async findOne(@Param() params: IdRequestDto): Promise<PositionResponseDto> {
    const record = await this.queryBus.execute<FindPositionQuery, Position>(
      new FindPositionQuery(params.id),
    );
    return new PositionResponseDto(record);
  }

  @ApiOperation({ summary: 'Update position (Admin only)' })
  @ApiOkResponse()
  @ApiNotFoundResponse()
  @Roles('admin')
  @Patch(':id')
  async update(
    @Param() params: IdRequestDto,
    @Body() body: UpdatePositionRequestDto,
  ): Promise<void> {
    await this.commandBus.execute<UpdatePositionCommand, void>(
      new UpdatePositionCommand({
        positionId: params.id,
        name: body.name,
        parentId: body.parentId,
      }),
    );
  }

  @ApiOperation({ summary: 'Delete position (Admin only)' })
  @ApiOkResponse()
  @ApiNotFoundResponse()
  @Roles('admin')
  @Delete(':id')
  async remove(@Param() params: IdRequestDto): Promise<void> {
    await this.commandBus.execute<DeletePositionCommand, void>(
      new DeletePositionCommand({ positionId: params.id }),
    );
  }
}
