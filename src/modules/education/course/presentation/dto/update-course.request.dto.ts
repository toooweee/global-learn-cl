import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class UpdateCourseRequestDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MinLength(1)
  description?: string;
  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsUUID()
  coverId?: string | null;
}
