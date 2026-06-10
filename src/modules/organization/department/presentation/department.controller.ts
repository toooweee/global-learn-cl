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
import { Department } from '@generated/client';
import { CreateDepartmentRequestDto } from '@/modules/organization/department/presentation/dto/create-department.request.dto';
import { UpdateDepartmentRequestDto } from '@/modules/organization/department/presentation/dto/update-department.request.dto';
import { DepartmentResponseDto } from '@/modules/organization/department/presentation/dto/department.response.dto';
import { CreateDepartmentCommand } from '@/modules/organization/department/application/commands/create-department/create-department.command';
import { UpdateDepartmentCommand } from '@/modules/organization/department/application/commands/update-department/update-department.command';
import { DeleteDepartmentCommand } from '@/modules/organization/department/application/commands/delete-department/delete-department.command';
import { FindDepartmentQuery } from '@/modules/organization/department/application/queries/find-department/find-department.query';
import { FindDepartmentsQuery } from '@/modules/organization/department/application/queries/find-departments/find-departments.query';

@ApiTags('departments')
@Controller('departments')
export class DepartmentController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @ApiOperation({ summary: 'Create department (Admin only)' })
  @ApiCreatedResponse({ type: IdResponseDto })
  @Roles('admin')
  @Post()
  async create(
    @Body() body: CreateDepartmentRequestDto,
  ): Promise<IdResponseDto> {
    const id = await this.commandBus.execute<CreateDepartmentCommand, string>(
      new CreateDepartmentCommand({ name: body.name }),
    );
    return new IdResponseDto(id);
  }

  @ApiOperation({ summary: 'List departments' })
  @ApiPaginatedResponse(DepartmentResponseDto)
  @Get()
  async findAll(
    @Query() query: PaginatedQueryRequestDto,
  ): Promise<PaginatedResponseDto<DepartmentResponseDto>> {
    const result = await this.queryBus.execute<
      FindDepartmentsQuery,
      Paginated<Department>
    >(new FindDepartmentsQuery({ limit: query.limit, page: query.page }));
    return new PaginatedResponseDto<DepartmentResponseDto>({
      count: result.count,
      limit: result.limit,
      page: result.page,
      data: result.data.map((d) => new DepartmentResponseDto(d)),
    });
  }

  @ApiOperation({ summary: 'Get department by id' })
  @ApiOkResponse({ type: DepartmentResponseDto })
  @ApiNotFoundResponse()
  @Get(':id')
  async findOne(@Param() params: IdRequestDto): Promise<DepartmentResponseDto> {
    const record = await this.queryBus.execute<FindDepartmentQuery, Department>(
      new FindDepartmentQuery(params.id),
    );
    return new DepartmentResponseDto(record);
  }

  @ApiOperation({ summary: 'Update department (Admin only)' })
  @ApiOkResponse()
  @ApiNotFoundResponse()
  @Roles('admin')
  @Patch(':id')
  async update(
    @Param() params: IdRequestDto,
    @Body() body: UpdateDepartmentRequestDto,
  ): Promise<void> {
    await this.commandBus.execute<UpdateDepartmentCommand, void>(
      new UpdateDepartmentCommand({ departmentId: params.id, name: body.name }),
    );
  }

  @ApiOperation({ summary: 'Delete department (Admin only)' })
  @ApiOkResponse()
  @ApiNotFoundResponse()
  @Roles('admin')
  @Delete(':id')
  async remove(@Param() params: IdRequestDto): Promise<void> {
    await this.commandBus.execute<DeleteDepartmentCommand, void>(
      new DeleteDepartmentCommand({ departmentId: params.id }),
    );
  }
}
