import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ApplicationException } from '@/libs/application/exceptions/application.exception';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { ApproveCourseApplicationCommand } from './approve-course-application.command';
import {
  COURSE_APPLICATION_REPOSITORY,
  type CourseApplicationRepositoryPort,
} from '@/modules/education/course-application/application/ports/course-application.repository.port';
import { NotificationService } from '@/modules/notifications/notification.service';
import { MailService } from '@/modules/mail/mail.service';

@CommandHandler(ApproveCourseApplicationCommand)
export class ApproveCourseApplicationCommandHandler implements ICommandHandler<
  ApproveCourseApplicationCommand,
  void
> {
  constructor(
    @Inject(COURSE_APPLICATION_REPOSITORY)
    private readonly repository: CourseApplicationRepositoryPort,
    private readonly prismaService: PrismaService,
    private readonly notificationService: NotificationService,
    private readonly mailService: MailService,
  ) {}

  async execute(command: ApproveCourseApplicationCommand): Promise<void> {
    const option = await this.repository.findById(command.applicationId);
    if (option.isNone()) {
      throw new ApplicationException(
        'Application not found',
        404,
        'COURSE_APPLICATION_NOT_FOUND',
      );
    }

    const application = option.unwrap();
    application.approve();

    const props = application.getProps();

    const enrollmentExists =
      await this.prismaService.client.courseEnrollment.findUnique({
        where: {
          courseId_employeeId: {
            courseId: props.courseId,
            employeeId: props.employeeId,
          },
        },
      });

    await this.prismaService.client.$transaction(async (tx) => {
      await tx.courseApplication.update({
        where: { id: application.id },
        data: { status: props.status, updatedAt: props.updatedAt },
      });

      if (!enrollmentExists) {
        await tx.courseEnrollment.create({
          data: { courseId: props.courseId, employeeId: props.employeeId },
        });
      }
    });

    // employeeId === userId in this schema (shared PK)
    const userId = props.employeeId;

    this.notificationService
      .notify(userId, 'COURSE_APPLICATION_APPROVED', {
        applicationId: application.id,
      })
      .catch(() => undefined);

    this.prismaService.client.course
      .findUnique({ where: { id: props.courseId }, select: { name: true } })
      .then(async (course) => {
        const user = await this.prismaService.client.user.findUnique({
          where: { id: userId },
          select: { email: true },
        });
        if (user?.email && course?.name) {
          return this.mailService.sendCourseEnrollmentApproved(user.email, {
            courseName: course.name,
          });
        }
      })
      .catch(() => undefined);
  }
}
