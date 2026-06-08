import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateLessonRequestDto {
  @ApiProperty({ example: 'Introduction to TypeScript' })
  @IsString()
  @MinLength(1)
  name: string;

  @ApiPropertyOptional({ example: 'In this lesson we cover...' })
  @IsOptional()
  @IsString()
  content?: string;
}

export class UpdateLessonRequestDto {
  @ApiPropertyOptional({ example: 'Introduction to TypeScript' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @ApiPropertyOptional({ example: 'In this lesson we cover...' })
  @IsOptional()
  @IsString()
  content?: string;
}
