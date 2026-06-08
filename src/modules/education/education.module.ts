import { Module } from '@nestjs/common';
import { PrismaModule } from '@/infra/prisma/prisma.module';
import { NotificationModule } from '@/modules/notifications/notification.module';
import { MailModule } from '@/modules/mail/mail.module';

// Course
import { CourseMapper } from '@/modules/education/course/course.mapper';
import { COURSE_REPOSITORY } from '@/modules/education/course/application/ports/course.repository.port';
import { CoursePrismaRepository } from '@/modules/education/course/infra/course-prisma.repository';
import { CreateCourseCommandHandler } from '@/modules/education/course/application/commands/create-course/create-course.command-handler';
import { UpdateCourseCommandHandler } from '@/modules/education/course/application/commands/update-course/update-course.command-handler';
import { DeleteCourseCommandHandler } from '@/modules/education/course/application/commands/delete-course/delete-course.command-handler';
import { AddModuleCommandHandler } from '@/modules/education/course/application/commands/add-module/add-module.command-handler';
import { RemoveModuleCommandHandler } from '@/modules/education/course/application/commands/remove-module/remove-module.command-handler';
import { AddStepCommandHandler } from '@/modules/education/course/application/commands/add-step/add-step.command-handler';
import { RemoveStepCommandHandler } from '@/modules/education/course/application/commands/remove-step/remove-step.command-handler';
import { FindCourseQueryHandler } from '@/modules/education/course/application/queries/find-course/find-course.query-handler';
import { FindCoursesQueryHandler } from '@/modules/education/course/application/queries/find-courses/find-courses.query-handler';
import { CourseController } from '@/modules/education/course/presentation/course.controller';

// CourseApplication
import { CourseApplicationMapper } from '@/modules/education/course-application/course-application.mapper';
import { COURSE_APPLICATION_REPOSITORY } from '@/modules/education/course-application/application/ports/course-application.repository.port';
import { CourseApplicationPrismaRepository } from '@/modules/education/course-application/infra/course-application-prisma.repository';
import { ApplyForCourseCommandHandler } from '@/modules/education/course-application/application/commands/apply-for-course/apply-for-course.command-handler';
import { ApproveCourseApplicationCommandHandler } from '@/modules/education/course-application/application/commands/approve-course-application/approve-course-application.command-handler';
import { RejectCourseApplicationCommandHandler } from '@/modules/education/course-application/application/commands/reject-course-application/reject-course-application.command-handler';
import { FindApplicationsForCourseQueryHandler } from '@/modules/education/course-application/application/queries/find-applications-for-course/find-applications-for-course.query-handler';
import { FindMyApplicationsQueryHandler } from '@/modules/education/course-application/application/queries/find-my-applications/find-my-applications.query-handler';
import { CourseApplicationController } from '@/modules/education/course-application/presentation/course-application.controller';

// Enrollment
import { EnrollmentMapper } from '@/modules/education/enrollment/enrollment.mapper';
import { ENROLLMENT_REPOSITORY } from '@/modules/education/enrollment/application/ports/enrollment.repository.port';
import { EnrollmentPrismaRepository } from '@/modules/education/enrollment/infra/enrollment-prisma.repository';
import { CreateEnrollmentCommandHandler } from '@/modules/education/enrollment/application/commands/create-enrollment/create-enrollment.command-handler';
import { StartStepCommandHandler } from '@/modules/education/enrollment/application/commands/start-step/start-step.command-handler';
import { CompleteStepCommandHandler } from '@/modules/education/enrollment/application/commands/complete-step/complete-step.command-handler';
import { CancelEnrollmentCommandHandler } from '@/modules/education/enrollment/application/commands/cancel-enrollment/cancel-enrollment.command-handler';
import { FindEnrollmentQueryHandler } from '@/modules/education/enrollment/application/queries/find-enrollment/find-enrollment.query-handler';
import { FindMyEnrollmentsQueryHandler } from '@/modules/education/enrollment/application/queries/find-my-enrollments/find-my-enrollments.query-handler';
import { FindEnrollmentsForCourseQueryHandler } from '@/modules/education/enrollment/application/queries/find-enrollments-for-course/find-enrollments-for-course.query-handler';
import { EnrollmentController } from '@/modules/education/enrollment/presentation/enrollment.controller';

// TestAttempt
import { TestAttemptMapper } from '@/modules/education/test-attempt/test-attempt.mapper';
import { TEST_ATTEMPT_REPOSITORY } from '@/modules/education/test-attempt/application/ports/test-attempt.repository.port';
import { TestAttemptPrismaRepository } from '@/modules/education/test-attempt/infra/test-attempt-prisma.repository';
import { StartTestAttemptCommandHandler } from '@/modules/education/test-attempt/application/commands/start-test-attempt/start-test-attempt.command-handler';
import { AnswerQuestionCommandHandler } from '@/modules/education/test-attempt/application/commands/answer-question/answer-question.command-handler';
import { FinishTestAttemptCommandHandler } from '@/modules/education/test-attempt/application/commands/finish-test-attempt/finish-test-attempt.command-handler';
import { FindTestAttemptQueryHandler } from '@/modules/education/test-attempt/application/queries/find-test-attempt/find-test-attempt.query-handler';
import { TestAttemptController } from '@/modules/education/test-attempt/presentation/test-attempt.controller';

// Lesson
import { LessonMapper } from '@/modules/education/lesson/lesson.mapper';
import { LESSON_REPOSITORY } from '@/modules/education/lesson/application/ports/lesson.repository.port';
import { LessonPrismaRepository } from '@/modules/education/lesson/infra/lesson-prisma.repository';
import { CreateLessonCommandHandler } from '@/modules/education/lesson/application/commands/create-lesson/create-lesson.command-handler';
import { UpdateLessonCommandHandler } from '@/modules/education/lesson/application/commands/update-lesson/update-lesson.command-handler';
import { DeleteLessonCommandHandler } from '@/modules/education/lesson/application/commands/delete-lesson/delete-lesson.command-handler';
import { LessonController } from '@/modules/education/lesson/presentation/lesson.controller';

// TestDefinition + CourseQuestion
import { TestDefinitionMapper } from '@/modules/education/test-definition/test-definition.mapper';
import {
  TEST_DEFINITION_REPOSITORY,
  COURSE_QUESTION_REPOSITORY,
} from '@/modules/education/test-definition/application/ports/test-definition.repository.port';
import {
  TestDefinitionPrismaRepository,
  CourseQuestionPrismaRepository,
} from '@/modules/education/test-definition/infra/test-definition-prisma.repository';
import { CreateTestDefinitionCommandHandler } from '@/modules/education/test-definition/application/commands/create-test-definition/create-test-definition.command-handler';
import { UpdateTestDefinitionCommandHandler } from '@/modules/education/test-definition/application/commands/update-test-definition/update-test-definition.command-handler';
import { DeleteTestDefinitionCommandHandler } from '@/modules/education/test-definition/application/commands/delete-test-definition/delete-test-definition.command-handler';
import { AddQuestionToTestCommandHandler } from '@/modules/education/test-definition/application/commands/add-question-to-test/add-question-to-test.command-handler';
import { RemoveQuestionFromTestCommandHandler } from '@/modules/education/test-definition/application/commands/remove-question-from-test/remove-question-from-test.command-handler';
import { CreateCourseQuestionCommandHandler } from '@/modules/education/test-definition/application/commands/create-course-question/create-course-question.command-handler';
import { DeleteCourseQuestionCommandHandler } from '@/modules/education/test-definition/application/commands/delete-course-question/delete-course-question.command-handler';
import { FindTestDefinitionQueryHandler } from '@/modules/education/test-definition/application/queries/find-test-definition/find-test-definition.query-handler';
import { FindCourseQuestionsQueryHandler } from '@/modules/education/test-definition/application/queries/find-course-questions/find-course-questions.query-handler';
import { TestDefinitionController } from '@/modules/education/test-definition/presentation/test-definition.controller';

@Module({
  imports: [PrismaModule, NotificationModule, MailModule],
  controllers: [
    CourseController,
    CourseApplicationController,
    EnrollmentController,
    TestAttemptController,
    LessonController,
    TestDefinitionController,
  ],
  providers: [
    // Course
    CourseMapper,
    { provide: COURSE_REPOSITORY, useClass: CoursePrismaRepository },
    CreateCourseCommandHandler,
    UpdateCourseCommandHandler,
    DeleteCourseCommandHandler,
    AddModuleCommandHandler,
    RemoveModuleCommandHandler,
    AddStepCommandHandler,
    RemoveStepCommandHandler,
    FindCourseQueryHandler,
    FindCoursesQueryHandler,

    // CourseApplication
    CourseApplicationMapper,
    {
      provide: COURSE_APPLICATION_REPOSITORY,
      useClass: CourseApplicationPrismaRepository,
    },
    ApplyForCourseCommandHandler,
    ApproveCourseApplicationCommandHandler,
    RejectCourseApplicationCommandHandler,
    FindApplicationsForCourseQueryHandler,
    FindMyApplicationsQueryHandler,

    // Enrollment
    EnrollmentMapper,
    { provide: ENROLLMENT_REPOSITORY, useClass: EnrollmentPrismaRepository },
    CreateEnrollmentCommandHandler,
    StartStepCommandHandler,
    CompleteStepCommandHandler,
    CancelEnrollmentCommandHandler,
    FindEnrollmentQueryHandler,
    FindMyEnrollmentsQueryHandler,
    FindEnrollmentsForCourseQueryHandler,

    // TestAttempt
    TestAttemptMapper,
    { provide: TEST_ATTEMPT_REPOSITORY, useClass: TestAttemptPrismaRepository },
    StartTestAttemptCommandHandler,
    AnswerQuestionCommandHandler,
    FinishTestAttemptCommandHandler,
    FindTestAttemptQueryHandler,

    // Lesson
    LessonMapper,
    { provide: LESSON_REPOSITORY, useClass: LessonPrismaRepository },
    CreateLessonCommandHandler,
    UpdateLessonCommandHandler,
    DeleteLessonCommandHandler,

    // TestDefinition + CourseQuestion
    TestDefinitionMapper,
    {
      provide: TEST_DEFINITION_REPOSITORY,
      useClass: TestDefinitionPrismaRepository,
    },
    {
      provide: COURSE_QUESTION_REPOSITORY,
      useClass: CourseQuestionPrismaRepository,
    },
    CreateTestDefinitionCommandHandler,
    UpdateTestDefinitionCommandHandler,
    DeleteTestDefinitionCommandHandler,
    AddQuestionToTestCommandHandler,
    RemoveQuestionFromTestCommandHandler,
    CreateCourseQuestionCommandHandler,
    DeleteCourseQuestionCommandHandler,
    FindTestDefinitionQueryHandler,
    FindCourseQuestionsQueryHandler,
  ],
})
export class EducationModule {}
