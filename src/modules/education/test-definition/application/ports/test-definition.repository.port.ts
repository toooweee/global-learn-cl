import { Option } from 'oxide.ts';
import { TestDefinitionEntity } from '@/modules/education/test-definition/domain/test-definition.entity';
import { CourseQuestionEntity } from '@/modules/education/test-definition/domain/course-question.entity';

export const TEST_DEFINITION_REPOSITORY = Symbol('TEST_DEFINITION_REPOSITORY');
export const COURSE_QUESTION_REPOSITORY = Symbol('COURSE_QUESTION_REPOSITORY');

export interface TestDefinitionRepositoryPort {
  save(entity: TestDefinitionEntity): Promise<void>;
  findById(id: string): Promise<Option<TestDefinitionEntity>>;
  delete(id: string): Promise<void>;
  addQuestion(testId: string, questionId: string): Promise<void>;
  removeQuestion(testId: string, questionId: string): Promise<void>;
  bulkAddQuestions(testId: string, questionIds: string[]): Promise<void>;
  replaceQuestions(testId: string, questionIds: string[]): Promise<void>;
}

export interface CourseQuestionRepositoryPort {
  save(entity: CourseQuestionEntity): Promise<void>;
  findById(id: string): Promise<Option<CourseQuestionEntity>>;
  findByCourse(courseId: string): Promise<CourseQuestionEntity[]>;
  delete(id: string): Promise<void>;
}
