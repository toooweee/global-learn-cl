import { ApiProperty } from '@nestjs/swagger';

class BulkEnrollFailedItemDto {
  @ApiProperty()
  employeeId: string;

  @ApiProperty()
  reason: string;

  constructor(props: BulkEnrollFailedItemDto) {
    this.employeeId = props.employeeId;
    this.reason = props.reason;
  }
}

export class BulkEnrollResponseDto {
  @ApiProperty({
    type: [String],
    description: 'Successfully enrolled employee IDs',
  })
  enrolled: string[];

  @ApiProperty({
    type: [String],
    description: 'Already had active enrollment (skipped)',
  })
  alreadyEnrolled: string[];

  @ApiProperty({
    type: [BulkEnrollFailedItemDto],
    description: 'Failed enrollments with reasons',
  })
  failed: BulkEnrollFailedItemDto[];

  constructor(props: {
    enrolled: string[];
    alreadyEnrolled: string[];
    failed: { employeeId: string; reason: string }[];
  }) {
    this.enrolled = props.enrolled;
    this.alreadyEnrolled = props.alreadyEnrolled;
    this.failed = props.failed.map((f) => new BulkEnrollFailedItemDto(f));
  }
}
