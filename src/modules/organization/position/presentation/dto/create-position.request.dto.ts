import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsUUID, Length } from 'class-validator';

export class CreatePositionRequestDto {
  @ApiProperty({ example: 'Backend Engineer' })
  @IsNotEmpty()
  @Length(1, 255)
  name: string;

  @ApiPropertyOptional({
    example: '2cdc8ab1-6d50-49cc-ba14-54e4ac7ec231',
    nullable: true,
  })
  @IsOptional()
  @IsUUID()
  parentId?: string;
}
