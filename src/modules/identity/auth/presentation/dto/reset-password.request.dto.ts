import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';

export class ResetPasswordRequestDto {
  @ApiProperty({
    example: 'abc123...',
    description: 'Reset token from email link',
  })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({ example: 'johndoe@company.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty()
  @IsNotEmpty()
  @Length(4, 30)
  newPassword: string;
}
