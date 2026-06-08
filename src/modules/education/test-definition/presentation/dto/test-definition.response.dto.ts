import { ApiProperty } from '@nestjs/swagger';
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
  @ApiProperty({
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    required: false,
  })
  moduleId?: string;
  @ApiProperty({ type: [CourseAnswerResponseDto] })
  answers: CourseAnswerResponseDto[];

  constructor(props: {
    id: string;
    question: string;
    courseId: string;
    moduleId?: string | null;
    answers: { id: string; answer: string; isCorrect: boolean }[];
  }) {
    this.id = props.id;
    this.question = props.question;
    this.courseId = props.courseId;
    this.moduleId = props.moduleId ?? undefined;
    this.answers = props.answers.map((a) => new CourseAnswerResponseDto(a));
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
