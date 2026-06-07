import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsUUID, Length } from 'class-validator';

export class UpdatePositionRequestDto {
  @ApiProperty({ example: 'Backend Engineer' })
  @IsNotEmpty()
  @Length(1, 255)
  name: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID()
  parentId?: string | null;
}
