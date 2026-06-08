import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import {
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { IdResponseDto } from '@/libs/api/dto';
import { IdRequestDto } from '@/libs/api/dto/id.request.dto';
import { Roles } from '@/libs/auth/decorators/roles.decorator';
import { CreateLessonCommand } from '@/modules/education/lesson/application/commands/create-lesson/create-lesson.command';
import { UpdateLessonCommand } from '@/modules/education/lesson/application/commands/update-lesson/update-lesson.command';
import { DeleteLessonCommand } from '@/modules/education/lesson/application/commands/delete-lesson/delete-lesson.command';
import {
  CreateLessonRequestDto,
  UpdateLessonRequestDto,
} from './dto/lesson.request.dto';

@ApiTags('lessons')
@Controller('lessons')
@Roles('admin', 'manager')
export class LessonController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post()
  @ApiOperation({ summary: 'Create a lesson' })
  @ApiCreatedResponse({ type: IdResponseDto })
  create(@Body() dto: CreateLessonRequestDto): Promise<IdResponseDto> {
    return this.commandBus.execute(
      new CreateLessonCommand({ name: dto.name, content: dto.content }),
    );
  }

  @Patch(':id')
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
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a lesson' })
  @ApiNoContentResponse()
  @ApiNotFoundResponse()
  remove(@Param() { id }: IdRequestDto): Promise<void> {
    return this.commandBus.execute(new DeleteLessonCommand({ lessonId: id }));
  }
}
