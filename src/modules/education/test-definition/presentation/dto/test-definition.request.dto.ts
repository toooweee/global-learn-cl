import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class TestDefinitionRequestDto {
  @ApiProperty({ example: 'NestJS fundamentals quiz' })
  @IsString()
  @MinLength(1)
  name: string;

  @ApiProperty({
    example: 80,
    description: 'Passing threshold in percent',
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  passingPercent?: number;
}

export class CourseAnswerRequestDto {
  @ApiProperty({ example: 'NestJS is a Node.js framework' })
  @IsString()
  @MinLength(1)
  answer: string;
  @ApiProperty({ example: true }) @IsBoolean() isCorrect: boolean;
}

export class CreateCourseQuestionRequestDto {
  @ApiProperty({ example: 'What is NestJS?' })
  @IsString()
  @MinLength(1)
  question: string;
  @ApiProperty({
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  moduleId?: string;

  @ApiProperty({ type: [CourseAnswerRequestDto] })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => CourseAnswerRequestDto)
  answers: CourseAnswerRequestDto[];
}

export class AddQuestionToTestRequestDto {
  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  @IsUUID()
  questionId: string;
}

export class UpdateCourseQuestionRequestDto {
  @ApiPropertyOptional({ example: 'What is NestJS?' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  question?: string;

  @ApiPropertyOptional({ type: [CourseAnswerRequestDto] })
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => CourseAnswerRequestDto)
  answers?: CourseAnswerRequestDto[];
}
