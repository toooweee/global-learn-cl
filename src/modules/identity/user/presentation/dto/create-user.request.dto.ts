import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsUUID,
  Length,
  MinLength,
} from 'class-validator';

export class CreateUserRequestDto {
  @ApiProperty({ example: 'johndoe@gmail.com' })
  @IsNotEmpty()
  @IsEmail()
  @MinLength(5)
  email: string;

  @ApiProperty()
  @IsNotEmpty()
  @Length(4, 30)
  password: string;

  @ApiProperty({ example: '2cdc8ab1-6d50-49cc-ba14-54e4ac7ec231' })
  @IsNotEmpty()
  @IsUUID()
  roleId: string;
}
