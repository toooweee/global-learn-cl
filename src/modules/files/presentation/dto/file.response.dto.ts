import { ApiProperty } from '@nestjs/swagger';
import { IdResponseDto } from '@/libs/api/dto';

export class FileResponseDto extends IdResponseDto {
  @ApiProperty({
    example:
      'http://localhost:9000/global-learn/1749870000000-avatar.jpg?X-Amz-...',
  })
  readonly url: string;

  constructor(props: { id: string; url: string }) {
    super(props.id);
    this.url = props.url;
  }
}
