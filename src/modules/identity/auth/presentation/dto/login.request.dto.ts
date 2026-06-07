import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, Length } from 'class-validator';

export class LoginRequestDto {
  @ApiProperty({ example: process.env.TEST_ADMIN_EMAIL })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: process.env.TEST_ADMIN_PASSWORD })
  @IsNotEmpty()
  @Length(4, 30)
  password: string;
}
