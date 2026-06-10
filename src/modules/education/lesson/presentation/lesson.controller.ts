import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
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
import { Roles } from '@/libs/auth/decorators/roles.decorator';
import { CreateLessonCommand } from '@/modules/education/lesson/application/commands/create-lesson/create-lesson.command';
import { UpdateLessonCommand } from '@/modules/education/lesson/application/commands/update-lesson/update-lesson.command';
import { DeleteLessonCommand } from '@/modules/education/lesson/application/commands/delete-lesson/delete-lesson.command';
import { FindLessonQuery } from '@/modules/education/lesson/application/queries/find-lesson/find-lesson.query';
import {
  CreateLessonRequestDto,
  UpdateLessonRequestDto,
} from './dto/lesson.request.dto';
import { LessonResponseDto } from './dto/lesson.response.dto';

@ApiTags('lessons')
@Controller('lessons')
export class LessonController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @Roles('admin', 'department_head', 'division_head')
  @ApiOperation({ summary: 'Create a lesson' })
  @ApiCreatedResponse({ type: IdResponseDto })
  create(@Body() dto: CreateLessonRequestDto): Promise<IdResponseDto> {
    return this.commandBus.execute(
      new CreateLessonCommand({ name: dto.name, content: dto.content }),
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get lesson by ID' })
  @ApiOkResponse({ type: LessonResponseDto })
  @ApiNotFoundResponse()
  findOne(@Param() { id }: IdRequestDto): Promise<LessonResponseDto> {
    return this.queryBus.execute(new FindLessonQuery({ lessonId: id }));
  }

  @Patch(':id')
  @Roles('admin', 'department_head', 'division_head')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Update lesson name and/or content' })
  @ApiNoContentResponse()
  @ApiNotFoundResponse()
  update(
    @Param() { id }: IdRequestDto,
    @Body() dto: UpdateLessonRequestDto,
  ): Promise<void> {
    return this.commandBus.execute(
      new UpdateLessonCommand({
        lessonId: id,
        name: dto.name,
        content: dto.content,
      }),
    );
  }

  @Delete(':id')
  @Roles('admin', 'department_head', 'division_head')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a lesson' })
  @ApiNoContentResponse()
  @ApiNotFoundResponse()
  remove(@Param() { id }: IdRequestDto): Promise<void> {
    return this.commandBus.execute(new DeleteLessonCommand({ lessonId: id }));
  }
}
