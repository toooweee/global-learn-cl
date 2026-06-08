import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ApplicationException } from '@/libs/application/exceptions/application.exception';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { courseInclude } from '@/modules/education/course/course.mapper';
import {
  CourseResponseDto,
  ModuleResponseDto,
  StepResponseDto,
} from '@/modules/education/course/presentation/dto/course.response.dto';
import { FindCourseQuery } from './find-course.query';

@QueryHandler(FindCourseQuery)
export class FindCourseQueryHandler implements IQueryHandler<
  FindCourseQuery,
  CourseResponseDto
> {
  constructor(private readonly prismaService: PrismaService) {}

  async execute(query: FindCourseQuery): Promise<CourseResponseDto> {
    const row = await this.prismaService.client.course.findUnique({
      where: { id: query.courseId },
      include: courseInclude,
    });

    if (!row) {
      throw new ApplicationException(
        'Course not found',
        404,
        'COURSE_NOT_FOUND',
      );
    }

    return new CourseResponseDto({
      id: row.id,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      name: row.name,
      description: row.description,
      authorId: row.authorId,
      coverId: row.coverId,
      modules: row.modules.map(
        (mod) =>
          new ModuleResponseDto({
            id: mod.id,
            name: mod.name,
            position: mod.position,
            steps: mod.steps.map(
              (step) =>
                new StepResponseDto({
                  id: step.id,
                  name: step.name,
                  position: step.position,
                  type: step.type,
                  lessonId: step.lessonId ?? undefined,
                  lessonContent: step.lesson?.content ?? undefined,
                  testId: step.testId ?? undefined,
                }),
            ),
          }),
      ),
    });
  }
}
