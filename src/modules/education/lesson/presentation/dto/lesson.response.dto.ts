import { ApiProperty } from '@nestjs/swagger';
import { BaseResponseDto } from '@/libs/api/dto/base.response.dto';

export class LessonResponseDto extends BaseResponseDto {
  @ApiProperty({ example: 'Introduction to TypeScript' })
  name: string;

  @ApiProperty({ example: 'In this lesson we cover...' })
  content: string;

  constructor(props: {
    id: string;
    name: string;
    content: string;
    createdAt: Date;
    updatedAt?: Date;
  }) {
    super(props);
    this.name = props.name;
    this.content = props.content;
  }
}
