import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ApplicationException } from '@/libs/application/exceptions/application.exception';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { ArchiveCourseCommand } from './archive-course.command';

@CommandHandler(ArchiveCourseCommand)
export class ArchiveCourseCommandHandler implements ICommandHandler<
  ArchiveCourseCommand,
  void
> {
  constructor(private readonly prismaService: PrismaService) {}

  async execute(command: ArchiveCourseCommand): Promise<void> {
    const course = await this.prismaService.client.course.findUnique({
      where: { id: command.courseId },
      select: { id: true },
    });
    if (!course) {
      throw new ApplicationException(
        'Course not found',
        404,
        'COURSE_NOT_FOUND',
      );
    }
    await this.prismaService.client.course.update({
      where: { id: command.courseId },
      data: { isArchived: command.archive },
    });
  }
}
