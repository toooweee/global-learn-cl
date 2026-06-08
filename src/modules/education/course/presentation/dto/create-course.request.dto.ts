import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class CreateCourseRequestDto {
  @ApiProperty() @IsString() @MinLength(1) name: string;
  @ApiProperty() @IsString() @MinLength(1) description: string;
  @ApiProperty({ required: false }) @IsOptional() @IsUUID() coverId?: string;
}
