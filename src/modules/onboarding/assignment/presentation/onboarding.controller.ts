import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
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
  ApiPropertyOptional,
  ApiTags,
} from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { OnboardingStatus } from '@generated/client';
import { AssignOnboardingCommand } from '@/modules/onboarding/assignment/application/assign-onboarding/assign-onboarding.command';
import { CompleteOnboardingStepCommand } from '@/modules/onboarding/assignment/application/complete-step/complete-step.command';
import { CancelOnboardingCommand } from '@/modules/onboarding/assignment/application/commands/cancel-onboarding/cancel-onboarding.command';
import { GetOnboardingQuery } from '@/modules/onboarding/assignment/application/queries/get-onboarding/get-onboarding.query';
import { ListMyOnboardingsQuery } from '@/modules/onboarding/assignment/application/queries/list-my-onboardings/list-my-onboardings.query';
import { ListAssignedByMeQuery } from '@/modules/onboarding/assignment/application/queries/list-assigned-by-me/list-assigned-by-me.query';
import { ListOnboardingsQuery } from '@/modules/onboarding/assignment/application/queries/list-onboardings/list-onboardings.query';
import { AssignOnboardingRequestDto } from '@/modules/onboarding/assignment/presentation/dto/assign-onboarding.request.dto';
import { CompleteOnboardingStepRequestDto } from '@/modules/onboarding/assignment/presentation/dto/complete-step.request.dto';
import {
  OnboardingResponseDto,
  OnboardingSummaryResponseDto,
} from '@/modules/onboarding/assignment/presentation/dto/onboarding.response.dto';
import { IdResponseDto } from '@/libs/api/dto';
import { PaginatedQueryRequestDto } from '@/libs/api/dto/paginated.query.request.dto';
import { PaginatedResponseDto } from '@/libs/api/dto/paginated.response.dto';
import { Paginated } from '@/libs/application/query.base';
import { CurrentUser } from '@/libs/auth/decorators/current-user.decorator';
import type { CurrentUserPayload } from '@/libs/auth/decorators/current-user.decorator';

class OnboardingsFilterQueryDto extends PaginatedQueryRequestDto {
  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsOptional()
  @IsUUID()
  assignedToId?: string;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsOptional()
  @IsUUID()
  assignedById?: string;

  @ApiPropertyOptional({ enum: OnboardingStatus })
  @IsOptional()
  @IsEnum(OnboardingStatus)
  status?: OnboardingStatus;
}

@ApiTags('onboardings')
@Controller('onboardings')
export class OnboardingController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Assign an onboarding from a template' })
  @ApiCreatedResponse({ type: IdResponseDto })
  @ApiNotFoundResponse()
  async assign(
    @Body() body: AssignOnboardingRequestDto,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<IdResponseDto> {
    return this.commandBus.execute(
      new AssignOnboardingCommand({ ...body, assignedById: user.userId }),
    );
  }

  @Get()
  @ApiOperation({
    summary:
      'List onboardings with optional filters (?assignedToId, ?assignedById, ?status)',
  })
  @ApiOkResponse({ type: PaginatedResponseDto })
  list(
    @Query() query: OnboardingsFilterQueryDto,
  ): Promise<Paginated<OnboardingSummaryResponseDto>> {
    return this.queryBus.execute(
      new ListOnboardingsQuery({
        limit: query.limit,
        page: query.page,
        assignedToId: query.assignedToId,
        assignedById: query.assignedById,
        status: query.status,
      }),
    );
  }

  @Get('mine')
  @ApiOperation({ summary: 'List my onboardings (as assignee)' })
  @ApiOkResponse({ type: [OnboardingSummaryResponseDto] })
  listMine(): Promise<OnboardingSummaryResponseDto[]> {
    return this.queryBus.execute(new ListMyOnboardingsQuery());
  }

  @Get('assigned-by-me')
  @ApiOperation({ summary: 'List onboardings I assigned (as manager)' })
  @ApiOkResponse({ type: [OnboardingSummaryResponseDto] })
  listAssignedByMe(): Promise<OnboardingSummaryResponseDto[]> {
    return this.queryBus.execute(new ListAssignedByMeQuery());
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get onboarding with steps' })
  @ApiOkResponse({ type: OnboardingResponseDto })
  @ApiNotFoundResponse()
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<OnboardingResponseDto> {
    return this.queryBus.execute(new GetOnboardingQuery({ onboardingId: id }));
  }

  @Post(':id/complete-step')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Complete the current step' })
  @ApiNoContentResponse()
  @ApiNotFoundResponse()
  async completeStep(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: CompleteOnboardingStepRequestDto,
  ): Promise<void> {
    await this.commandBus.execute(
      new CompleteOnboardingStepCommand({
        onboardingId: id,
        stepId: body.stepId,
        selectedOptionIds: body.selectedOptionIds,
        feedbackText: body.feedbackText,
      }),
    );
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Cancel an onboarding' })
  @ApiNoContentResponse()
  @ApiNotFoundResponse()
  async cancel(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.commandBus.execute(
      new CancelOnboardingCommand({ onboardingId: id }),
    );
  }
}
