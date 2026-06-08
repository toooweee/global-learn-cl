import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class AddModuleRequestDto {
  @ApiProperty() @IsString() @MinLength(1) name: string;
}
