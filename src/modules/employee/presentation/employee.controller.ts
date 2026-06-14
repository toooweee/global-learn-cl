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
import { ROLE } from '@/libs/auth/roles.constants';
import { ApplicationException } from '@/libs/application/exceptions/application.exception';
import { CurrentUser } from '@/libs/auth/decorators/current-user.decorator';
import type { CurrentUserPayload } from '@/libs/auth/decorators/current-user.decorator';
import { IdResponseDto, PaginatedResponseDto } from '@/libs/api/dto';
import { IdRequestDto } from '@/libs/api/dto/id.request.dto';
import { PaginatedQueryRequestDto } from '@/libs/api/dto/paginated.query.request.dto';
import { ApiPaginatedResponse } from '@/libs/api/decorators/api-paginated-response.decorator';
import { Paginated } from '@/libs/application';
import { CreateEmployeeRequestDto } from '@/modules/employee/presentation/dto/create-employee.request.dto';
import { UpdateEmployeeRequestDto } from '@/modules/employee/presentation/dto/update-employee.request.dto';
import { PromoteEmployeeRequestDto } from '@/modules/employee/presentation/dto/promote-employee.request.dto';
import { EmployeeResponseDto } from '@/modules/employee/presentation/dto/employee.response.dto';
import { CreateEmployeeCommand } from '@/modules/employee/application/create-employee/create-employee.command';
import { UpdateEmployeeCommand } from '@/modules/employee/application/update-employee/update-employee.command';
import { DeleteEmployeeCommand } from '@/modules/employee/application/delete-employee/delete-employee.command';
import { PromoteEmployeeCommand } from '@/modules/employee/application/promote-employee/promote-employee.command';
import { FindEmployeeQuery } from '@/modules/employee/application/queries/find-employee/find-employee.query';
import { FindEmployeesQuery } from '@/modules/employee/application/queries/find-employees/find-employees.query';
import { FindMySubordinatesQuery } from '@/modules/employee/application/queries/find-my-subordinates/find-my-subordinates.query';
import { GetManagerDashboardQuery } from '@/modules/employee/application/queries/get-manager-dashboard/get-manager-dashboard.query';
import { GetSubordinateTreeQuery } from '@/modules/employee/application/queries/get-subordinate-tree/get-subordinate-tree.query';
import { SubordinateTreeNodeDto } from '@/modules/employee/presentation/dto/subordinate-tree.response.dto';
import { ManagerDashboardResponseDto } from '@/modules/employee/presentation/dto/manager-dashboard.response.dto';
import { IsOptional, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

class EmployeeFilterQueryDto extends PaginatedQueryRequestDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  divisionId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @ApiPropertyOptional({ description: 'Фильтр по ID роли' })
  @IsOptional()
  @IsUUID()
  roleId?: string;
}

@ApiTags('employees')
@Controller('employees')
export class EmployeeController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @ApiOperation({ summary: 'Register employee (Admin only)' })
  @ApiCreatedResponse({ type: IdResponseDto })
  @Roles('admin')
  @Post()
  async create(@Body() body: CreateEmployeeRequestDto): Promise<IdResponseDto> {
    const id = await this.commandBus.execute<CreateEmployeeCommand, string>(
      new CreateEmployeeCommand(body),
    );
    return new IdResponseDto(id);
  }

  @ApiOperation({ summary: 'List employees' })
  @ApiPaginatedResponse(EmployeeResponseDto)
  @Get()
  async findAll(
    @Query() query: EmployeeFilterQueryDto,
  ): Promise<PaginatedResponseDto<EmployeeResponseDto>> {
    const result = await this.queryBus.execute<
      FindEmployeesQuery,
      Paginated<EmployeeResponseDto>
    >(
      new FindEmployeesQuery({
        limit: query.limit,
        page: query.page,
        divisionId: query.divisionId,
        departmentId: query.departmentId,
        roleId: query.roleId,
      }),
    );
    return new PaginatedResponseDto<EmployeeResponseDto>({
      count: result.count,
      limit: result.limit,
      page: result.page,
      data: result.data,
    });
  }

  @ApiOperation({
    summary:
      'Get manager dashboard: all recursive subordinates with their course and onboarding progress',
  })
  @ApiOkResponse({ type: ManagerDashboardResponseDto })
  @Get('me/team-dashboard')
  getTeamDashboard(
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<ManagerDashboardResponseDto> {
    return this.queryBus.execute(new GetManagerDashboardQuery(user.userId));
  }

  @ApiOperation({
    summary: 'Get my direct subordinates (flat list, one level)',
  })
  @ApiOkResponse({ type: [EmployeeResponseDto] })
  @Get('me/subordinates')
  async getMySubordinates(
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<EmployeeResponseDto[]> {
    return this.queryBus.execute<
      FindMySubordinatesQuery,
      EmployeeResponseDto[]
    >(new FindMySubordinatesQuery(user.userId));
  }

  @ApiOperation({
    summary:
      'Get subordinate org-chart tree: all recursive direct reports grouped by position hierarchy',
  })
  @ApiOkResponse({ type: [SubordinateTreeNodeDto] })
  @Get('me/subordinates/tree')
  getSubordinateTree(
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<SubordinateTreeNodeDto[]> {
    return this.queryBus.execute<
      GetSubordinateTreeQuery,
      SubordinateTreeNodeDto[]
    >(new GetSubordinateTreeQuery(user.userId));
  }

  @ApiOperation({ summary: 'Get employee by id' })
  @ApiOkResponse({ type: EmployeeResponseDto })
  @ApiNotFoundResponse()
  @Get(':id')
  async findOne(@Param() params: IdRequestDto): Promise<EmployeeResponseDto> {
    return this.queryBus.execute<FindEmployeeQuery, EmployeeResponseDto>(
      new FindEmployeeQuery(params.id),
    );
  }

  @ApiOperation({ summary: 'Update employee (self or Admin)' })
  @ApiOkResponse()
  @ApiNotFoundResponse()
  @Patch(':id')
  async update(
    @Param() params: IdRequestDto,
    @Body() body: UpdateEmployeeRequestDto,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<void> {
    if (user.role !== ROLE.ADMIN && user.userId !== params.id) {
      throw new ApplicationException(
        'You can only update your own profile',
        403,
        'FORBIDDEN',
      );
    }
    await this.commandBus.execute<UpdateEmployeeCommand, void>(
      new UpdateEmployeeCommand({
        employeeId: params.id,
        fullname: body.fullname,
        biography: body.biography,
        divisionId: body.divisionId,
        positionId: body.positionId,
        avatarId: body.avatarId,
      }),
    );
  }

  @ApiOperation({ summary: 'Promote employee (change position, Admin only)' })
  @ApiOkResponse()
  @ApiNotFoundResponse()
  @Roles('admin')
  @Patch(':id/promote')
  async promote(
    @Param() params: IdRequestDto,
    @Body() body: PromoteEmployeeRequestDto,
  ): Promise<void> {
    await this.commandBus.execute<PromoteEmployeeCommand, void>(
      new PromoteEmployeeCommand({
        employeeId: params.id,
        positionId: body.positionId,
      }),
    );
  }

  @ApiOperation({ summary: 'Dismiss employee (soft delete, Admin only)' })
  @ApiOkResponse()
  @ApiNotFoundResponse()
  @Roles('admin')
  @Delete(':id')
  async dismiss(@Param() params: IdRequestDto): Promise<void> {
    await this.commandBus.execute<DeleteEmployeeCommand, void>(
      new DeleteEmployeeCommand({ employeeId: params.id }),
    );
  }
}
