import { ApiProperty } from '@nestjs/swagger';
import { ApplicationStatus } from '@generated/client';
import { BaseResponseDto } from '@/libs/api/dto/base.response.dto';

export class CourseApplicationResponseDto extends BaseResponseDto {
  @ApiProperty() courseId: string;
  @ApiProperty() employeeId: string;
  @ApiProperty({ enum: ApplicationStatus }) status: ApplicationStatus;

  constructor(props: {
    id: string;
    createdAt: Date;
    updatedAt?: Date;
    courseId: string;
    employeeId: string;
    status: ApplicationStatus;
  }) {
    super(props);
    this.courseId = props.courseId;
    this.employeeId = props.employeeId;
    this.status = props.status;
  }
}
