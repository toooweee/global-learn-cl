import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CreateOnboardingTemplateCommand } from '@/modules/onboarding/template/application/create-template/create-template.command';
import { UpdateOnboardingTemplateCommand } from '@/modules/onboarding/template/application/commands/update-template/update-template.command';
import { GetOnboardingTemplateQuery } from '@/modules/onboarding/template/application/queries/get-template/get-template.query';
import { ListOnboardingTemplatesQuery } from '@/modules/onboarding/template/application/queries/list-templates/list-templates.query';
import { CreateOnboardingTemplateRequestDto } from '@/modules/onboarding/template/presentation/dto/create-template.request.dto';
import { UpdateOnboardingTemplateRequestDto } from '@/modules/onboarding/template/presentation/dto/update-template.request.dto';
import {
  OnboardingTemplateResponseDto,
  OnboardingTemplateSummaryResponseDto,
} from '@/modules/onboarding/template/presentation/dto/template.response.dto';
import { IdResponseDto } from '@/libs/api/dto';
import { PaginatedQueryRequestDto } from '@/libs/api/dto/paginated.query.request.dto';
import { Paginated } from '@/libs/application/query.base';
import { IsOptional, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Roles } from '@/libs/auth/decorators/roles.decorator';

class ListTemplatesQueryDto extends PaginatedQueryRequestDto {
  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsOptional()
  @IsUUID()
  positionId?: string;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsOptional()
  @IsUUID()
  divisionId?: string;
}

@ApiTags('onboarding-templates')
@Controller('onboarding/templates')
@Roles('admin', 'manager')
export class OnboardingTemplateController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create an onboarding template for a role' })
  @ApiCreatedResponse({ type: IdResponseDto })
  @ApiConflictResponse()
  create(
    @Body() body: CreateOnboardingTemplateRequestDto,
  ): Promise<IdResponseDto> {
    return this.commandBus.execute(new CreateOnboardingTemplateCommand(body));
  }

  @Get()
  @ApiOperation({ summary: 'List onboarding templates (paginated)' })
  @ApiOkResponse({ type: [OnboardingTemplateSummaryResponseDto] })
  findAll(
    @Query() query: ListTemplatesQueryDto,
  ): Promise<Paginated<OnboardingTemplateSummaryResponseDto>> {
    return this.queryBus.execute(
      new ListOnboardingTemplatesQuery({
        limit: query.limit,
        page: query.page,
        positionId: query.positionId,
        divisionId: query.divisionId,
      }),
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get onboarding template with steps' })
  @ApiOkResponse({ type: OnboardingTemplateResponseDto })
  @ApiNotFoundResponse()
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<OnboardingTemplateResponseDto> {
    return this.queryBus.execute(
      new GetOnboardingTemplateQuery({ templateId: id }),
    );
  }

  @Put(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Replace template metadata and steps' })
  @ApiNoContentResponse()
  @ApiNotFoundResponse()
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateOnboardingTemplateRequestDto,
  ): Promise<void> {
    await this.commandBus.execute(
      new UpdateOnboardingTemplateCommand({
        templateId: id,
        name: body.name,
        description: body.description,
        coverId: body.coverId,
        steps: body.steps,
      }),
    );
  }
}
