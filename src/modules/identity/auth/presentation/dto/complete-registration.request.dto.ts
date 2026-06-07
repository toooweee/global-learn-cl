import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, Length } from 'class-validator';

export class CompleteRegistrationRequestDto {
  @ApiProperty({ example: 'johndoe@company.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty()
  @IsNotEmpty()
  @Length(4, 30)
  newPassword: string;
}
