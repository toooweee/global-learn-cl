import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { IdResponseDto } from '@/libs/api/dto';
import { IdRequestDto } from '@/libs/api/dto/id.request.dto';
import { PaginatedQueryRequestDto } from '@/libs/api/dto/paginated.query.request.dto';
import { PaginatedResponseDto } from '@/libs/api/dto/paginated.response.dto';
import { Roles } from '@/libs/auth/decorators/roles.decorator';
import { CurrentUser } from '@/libs/auth/decorators/current-user.decorator';
import type { CurrentUserPayload } from '@/libs/auth/decorators/current-user.decorator';
import { CreateEnrollmentCommand } from '@/modules/education/enrollment/application/commands/create-enrollment/create-enrollment.command';
import { BulkEnrollCommand } from '@/modules/education/enrollment/application/commands/bulk-enroll/bulk-enroll.command';
import { CancelEnrollmentCommand } from '@/modules/education/enrollment/application/commands/cancel-enrollment/cancel-enrollment.command';
import { StartStepCommand } from '@/modules/education/enrollment/application/commands/start-step/start-step.command';
import { CompleteStepCommand } from '@/modules/education/enrollment/application/commands/complete-step/complete-step.command';
import { FindEnrollmentQuery } from '@/modules/education/enrollment/application/queries/find-enrollment/find-enrollment.query';
import { FindMyEnrollmentsQuery } from '@/modules/education/enrollment/application/queries/find-my-enrollments/find-my-enrollments.query';
import { FindEnrollmentsForCourseQuery } from '@/modules/education/enrollment/application/queries/find-enrollments-for-course/find-enrollments-for-course.query';
import { EnrollRequestDto } from './dto/enroll.request.dto';
import { BulkEnrollRequestDto } from './dto/bulk-enroll.request.dto';
import { BulkEnrollResponseDto } from './dto/bulk-enroll.response.dto';
import {
  EnrollmentResponseDto,
  EnrollmentSummaryResponseDto,
} from './dto/enrollment.response.dto';

@ApiTags('enrollments')
@Controller()
export class EnrollmentController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post('courses/:id/enroll')
  @Roles('admin', 'department_head', 'division_head', 'senior_manager')
  @ApiOperation({ summary: 'Enroll an employee in a course (admin/manager)' })
  @ApiCreatedResponse({ type: IdResponseDto })
  enroll(
    @Param() { id }: IdRequestDto,
    @Body() dto: EnrollRequestDto,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<IdResponseDto> {
    return this.commandBus.execute(
      new CreateEnrollmentCommand({
        courseId: id,
        employeeId: dto.employeeId,
        assignedById: user.userId,
      }),
    );
  }

  @Post('courses/:id/enroll/bulk')
  @Roles('admin', 'department_head', 'division_head', 'senior_manager')
  @ApiOperation({
    summary: 'Bulk-enroll multiple employees in a course (admin/manager)',
  })
  @ApiOkResponse({ type: BulkEnrollResponseDto })
  bulkEnroll(
    @Param() { id }: IdRequestDto,
    @Body() dto: BulkEnrollRequestDto,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<BulkEnrollResponseDto> {
    return this.commandBus.execute(
      new BulkEnrollCommand({
        courseId: id,
        employeeIds: dto.employeeIds,
        assignedById: user.userId,
      }),
    );
  }

  @Get('courses/:id/enrollments')
  @Roles('admin', 'department_head', 'division_head', 'senior_manager')
  @ApiOperation({
    summary: 'List all enrollments for a course (admin/manager)',
  })
  @ApiOkResponse({ type: PaginatedResponseDto })
  findForCourse(
    @Param() { id }: IdRequestDto,
    @Query() query: PaginatedQueryRequestDto,
  ): Promise<PaginatedResponseDto<EnrollmentResponseDto>> {
    return this.queryBus.execute(
      new FindEnrollmentsForCourseQuery({
        courseId: id,
        limit: query.limit,
        page: query.page,
      }),
    );
  }

  @Get('me/enrollments')
  @ApiOperation({ summary: 'List my enrollments' })
  @ApiOkResponse({ type: PaginatedResponseDto })
  findMine(
    @Query() query: PaginatedQueryRequestDto,
  ): Promise<PaginatedResponseDto<EnrollmentSummaryResponseDto>> {
    return this.queryBus.execute(
      new FindMyEnrollmentsQuery({ limit: query.limit, page: query.page }),
    );
  }

  @Get('enrollments/:id')
  @ApiOperation({ summary: 'Get enrollment by ID (with step progress)' })
  @ApiOkResponse({ type: EnrollmentResponseDto })
  @ApiNotFoundResponse()
  findOne(@Param() { id }: IdRequestDto): Promise<EnrollmentResponseDto> {
    return this.queryBus.execute(new FindEnrollmentQuery({ enrollmentId: id }));
  }

  @Delete('enrollments/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Cancel an enrollment' })
  @ApiNoContentResponse()
  @ApiNotFoundResponse()
  cancel(@Param() { id }: IdRequestDto): Promise<void> {
    return this.commandBus.execute(
      new CancelEnrollmentCommand({ enrollmentId: id }),
    );
  }

  @Post('enrollments/:id/steps/:stepId/start')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Mark a step as started' })
  @ApiNoContentResponse()
  startStep(
    @Param('id') id: string,
    @Param('stepId') stepId: string,
  ): Promise<void> {
    return this.commandBus.execute(
      new StartStepCommand({ enrollmentId: id, stepId }),
    );
  }

  @Post('enrollments/:id/steps/:stepId/complete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary:
      'Mark a step as completed; auto-completes enrollment when all steps done',
  })
  @ApiNoContentResponse()
  completeStep(
    @Param('id') id: string,
    @Param('stepId') stepId: string,
  ): Promise<void> {
    return this.commandBus.execute(
      new CompleteStepCommand({ enrollmentId: id, stepId }),
    );
  }
}
