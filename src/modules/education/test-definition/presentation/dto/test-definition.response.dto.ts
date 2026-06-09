import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseResponseDto } from '@/libs/api/dto/base.response.dto';

export class CourseAnswerResponseDto {
  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' }) id: string;
  @ApiProperty({ example: 'NestJS is a Node.js framework' }) answer: string;
  @ApiProperty({ example: true }) isCorrect: boolean;

  constructor(props: CourseAnswerResponseDto) {
    this.id = props.id;
    this.answer = props.answer;
    this.isCorrect = props.isCorrect;
  }
}

export class CourseQuestionResponseDto {
  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' }) id: string;
  @ApiProperty({ example: 'What is NestJS?' }) question: string;
  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  courseId: string;
  @ApiPropertyOptional({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  moduleId?: string;
  @ApiProperty({
    example: 2,
    description: 'Number of tests that include this question',
  })
  usedInTestsCount: number;
  @ApiProperty({ type: [CourseAnswerResponseDto] })
  answers: CourseAnswerResponseDto[];

  constructor(props: {
    id: string;
    question: string;
    courseId: string;
    moduleId?: string | null;
    usedInTestsCount?: number;
    answers: { id: string; answer: string; isCorrect: boolean }[];
  }) {
    this.id = props.id;
    this.question = props.question;
    this.courseId = props.courseId;
    this.moduleId = props.moduleId ?? undefined;
    this.usedInTestsCount = props.usedInTestsCount ?? 0;
    this.answers = props.answers.map((a) => new CourseAnswerResponseDto(a));
  }
}

export class QuestionBankModuleStatDto {
  @ApiPropertyOptional({ nullable: true }) moduleId: string | null;
  @ApiProperty() count: number;

  constructor(props: { moduleId: string | null; count: number }) {
    this.moduleId = props.moduleId;
    this.count = props.count;
  }
}

export class QuestionBankStatsDto {
  @ApiProperty() total: number;
  @ApiProperty({ description: 'Questions used in at least one test' })
  usedInTests: number;
  @ApiProperty({ description: 'Questions not assigned to any test' })
  unused: number;
  @ApiProperty({ type: [QuestionBankModuleStatDto] })
  byModule: QuestionBankModuleStatDto[];

  constructor(props: {
    total: number;
    usedInTests: number;
    byModule: { moduleId: string | null; count: number }[];
  }) {
    this.total = props.total;
    this.usedInTests = props.usedInTests;
    this.unused = props.total - props.usedInTests;
    this.byModule = props.byModule.map((m) => new QuestionBankModuleStatDto(m));
  }
}

export class TestDefinitionResponseDto extends BaseResponseDto {
  @ApiProperty({ example: 'NestJS fundamentals quiz' }) name: string;
  @ApiProperty({ example: 80, description: 'Passing threshold in percent' })
  passingPercent: number;
  @ApiProperty({ type: [CourseQuestionResponseDto] })
  questions: CourseQuestionResponseDto[];

  constructor(props: {
    id: string;
    createdAt: Date;
    updatedAt?: Date;
    name: string;
    passingPercent: number;
    questions: {
      id: string;
      question: string;
      courseId: string;
      moduleId?: string | null;
      answers: { id: string; answer: string; isCorrect: boolean }[];
    }[];
  }) {
    super(props);
    this.name = props.name;
    this.passingPercent = props.passingPercent;
    this.questions = props.questions.map(
      (q) => new CourseQuestionResponseDto(q),
    );
  }
}
