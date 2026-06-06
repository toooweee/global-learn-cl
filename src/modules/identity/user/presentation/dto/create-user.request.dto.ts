import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, Length, MinLength } from 'class-validator';

export class CreateUserRequestDto {
  @ApiProperty({
    example: 'johndoe@gmail.com',
    description: "The user's email address",
  })
  @IsNotEmpty()
  @IsEmail()
  @MinLength(5)
  email: string;

  @ApiProperty()
  @IsNotEmpty()
  @Length(4, 30)
  password: string;
}
