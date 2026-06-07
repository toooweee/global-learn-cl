import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, Length } from 'class-validator';

export class ChangePasswordRequestDto {
  @ApiProperty()
  @IsNotEmpty()
  @Length(4, 30)
  oldPassword: string;

  @ApiProperty()
  @IsNotEmpty()
  @Length(4, 30)
  newPassword: string;
}
