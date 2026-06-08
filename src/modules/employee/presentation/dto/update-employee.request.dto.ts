import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsUUID, Length } from 'class-validator';

export class UpdateEmployeeRequestDto {
  @ApiPropertyOptional({ example: 'John Doe' })
  @IsOptional()
  @IsNotEmpty()
  @Length(1, 255)
  fullname?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  biography?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  divisionId?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID()
  positionId?: string | null;

  @ApiPropertyOptional({
    nullable: true,
    description: 'ID файла-аватарки (из POST /files)',
  })
  @IsOptional()
  @IsUUID()
  avatarId?: string | null;
}
