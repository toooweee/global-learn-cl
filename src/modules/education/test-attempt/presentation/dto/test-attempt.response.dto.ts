import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseResponseDto } from '@/libs/api/dto/base.response.dto';

// ── Taker-facing test shape: questions WITHOUT the isCorrect flag, so the
// correct answers are never shipped to the person taking the test. ──────────
export class AttemptOptionDto {
  @ApiProperty() id: string;
  @ApiProperty() text: string;

  constructor(props: { id: string; text: string }) {
    this.id = props.id;
    this.text = props.text;
  }
}

export class AttemptQuestionDto {
  @ApiProperty() id: string;
  @ApiProperty() question: string;
  @ApiProperty({ type: () => [AttemptOptionDto] })
  options: AttemptOptionDto[];

  constructor(props: {
    id: string;
    question: string;
    options: AttemptOptionDto[];
  }) {
    this.id = props.id;
    this.question = props.question;
    this.options = props.options;
  }
}

export class TestForAttemptDto {
  @ApiProperty() testId: string;
  @ApiProperty({ example: 80 }) passingPercent: number;
  @ApiProperty({ type: () => [AttemptQuestionDto] })
  questions: AttemptQuestionDto[];

  constructor(props: {
    testId: string;
    passingPercent: number;
    questions: AttemptQuestionDto[];
  }) {
    this.testId = props.testId;
    this.passingPercent = props.passingPercent;
    this.questions = props.questions;
  }
}

export class TestAttemptResultDto {
  @ApiProperty({ example: 8, description: 'Number of correct answers' })
  correct: number;
  @ApiProperty({ example: 10, description: 'Total number of questions' })
  total: number;
  @ApiProperty({ example: 80, description: 'Score as a percentage' })
  score: number;
  @ApiProperty({
    example: true,
    description: 'Whether score >= test passingPercent',
  })
  isPassed: boolean;

  constructor(props: {
    correct: number;
    total: number;
    score: number;
    isPassed: boolean;
  }) {
    this.correct = props.correct;
    this.total = props.total;
    this.score = props.score;
    this.isPassed = props.isPassed;
  }
}

export class TestAttemptSummaryDto extends BaseResponseDto {
  @ApiProperty() testId: string;
  @ApiProperty() isFinished: boolean;
  @ApiPropertyOptional() endedAt?: string;
  @ApiPropertyOptional() score?: number;
  @ApiPropertyOptional() isPassed?: boolean;

  constructor(props: {
    id: string;
    createdAt: Date;
    testId: string;
    endedAt: Date | null;
    score: number | null;
    isPassed: boolean | null;
  }) {
    super(props);
    this.testId = props.testId;
    this.isFinished = !!props.endedAt;
    this.endedAt = props.endedAt?.toISOString();
    this.score = props.score ?? undefined;
    this.isPassed = props.isPassed ?? undefined;
  }
}

export class TestAttemptResponseDto extends BaseResponseDto {
  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  testId: string;
  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  employeeId: string;
  @ApiProperty({ example: '2025-01-01T00:00:00.000Z', required: false })
  endedAt?: string;
  @ApiProperty({
    example: 5,
    description: 'Number of questions answered so far',
  })
  answeredCount: number;

  constructor(props: {
    id: string;
    createdAt: Date;
    updatedAt?: Date;
    testId: string;
    employeeId: string;
    endedAt?: Date;
    answeredCount: number;
  }) {
    super(props);
    this.testId = props.testId;
    this.employeeId = props.employeeId;
    this.endedAt = props.endedAt?.toISOString();
    this.answeredCount = props.answeredCount;
  }
}
