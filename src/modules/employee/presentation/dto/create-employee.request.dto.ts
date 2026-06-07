import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  Length,
} from 'class-validator';

export class CreateEmployeeRequestDto {
  @ApiProperty({ example: 'johndoe@company.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty()
  @IsNotEmpty()
  @Length(4, 30)
  password: string;

  @ApiProperty({ example: '2cdc8ab1-6d50-49cc-ba14-54e4ac7ec231' })
  @IsUUID()
  roleId: string;

  @ApiProperty({ example: 'John Doe' })
  @IsNotEmpty()
  @Length(1, 255)
  fullname: string;

  @ApiProperty({ example: '2cdc8ab1-6d50-49cc-ba14-54e4ac7ec231' })
  @IsUUID()
  divisionId: string;

  @ApiProperty({ example: '2024-01-15T00:00:00.000Z' })
  @IsDate()
  @Type(() => Date)
  employmentDate: Date;

  @ApiPropertyOptional({
    example: '2cdc8ab1-6d50-49cc-ba14-54e4ac7ec231',
    nullable: true,
  })
  @IsOptional()
  @IsUUID()
  positionId?: string;
}
