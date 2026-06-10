import { ApiProperty } from '@nestjs/swagger';

export class CertificateResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() enrollmentId: string;
  @ApiProperty() employeeId: string;
  @ApiProperty() employeeName: string;
  @ApiProperty() courseId: string;
  @ApiProperty() courseName: string;
  @ApiProperty() issuedAt: string;

  constructor(props: {
    id: string;
    enrollmentId: string;
    employeeId: string;
    employeeName: string;
    courseId: string;
    courseName: string;
    issuedAt: Date;
  }) {
    this.id = props.id;
    this.enrollmentId = props.enrollmentId;
    this.employeeId = props.employeeId;
    this.employeeName = props.employeeName;
    this.courseId = props.courseId;
    this.courseName = props.courseName;
    this.issuedAt = props.issuedAt.toISOString();
  }
}
