import { ApiProperty } from '@nestjs/swagger';
import { StepType } from '@generated/client';
import { BaseResponseDto } from '@/libs/api/dto/base.response.dto';

export class StepResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty() position: number;
  @ApiProperty({ enum: StepType }) type: StepType;
  @ApiProperty({ required: false }) lessonId?: string;
  @ApiProperty({ required: false }) lessonContent?: string;
  @ApiProperty({ required: false }) testId?: string;

  constructor(props: {
    id: string;
    name: string;
    position: number;
    type: StepType;
    lessonId?: string;
    lessonContent?: string;
    testId?: string;
  }) {
    this.id = props.id;
    this.name = props.name;
    this.position = props.position;
    this.type = props.type;
    this.lessonId = props.lessonId;
    this.lessonContent = props.lessonContent;
    this.testId = props.testId;
  }
}

export class ModuleResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty() position: number;
  @ApiProperty({ type: [StepResponseDto] }) steps: StepResponseDto[];

  constructor(props: ModuleResponseDto) {
    this.id = props.id;
    this.name = props.name;
    this.position = props.position;
    this.steps = props.steps;
  }
}

export class CourseResponseDto extends BaseResponseDto {
  @ApiProperty() name: string;
  @ApiProperty() description: string;
  @ApiProperty() authorId: string;
  @ApiProperty({ required: false }) coverId?: string;
  @ApiProperty({ type: [ModuleResponseDto] }) modules: ModuleResponseDto[];

  constructor(props: {
    id: string;
    createdAt: Date;
    updatedAt?: Date;
    name: string;
    description: string;
    authorId: string;
    coverId?: string | null;
    modules: ModuleResponseDto[];
  }) {
    super(props);
    this.name = props.name;
    this.description = props.description;
    this.authorId = props.authorId;
    this.coverId = props.coverId ?? undefined;
    this.modules = props.modules;
  }
}

export class CourseSummaryResponseDto extends BaseResponseDto {
  @ApiProperty() name: string;
  @ApiProperty() description: string;
  @ApiProperty() authorId: string;
  @ApiProperty({ required: false }) coverId?: string;

  constructor(props: {
    id: string;
    createdAt: Date;
    updatedAt?: Date;
    name: string;
    description: string;
    authorId: string;
    coverId?: string | null;
  }) {
    super(props);
    this.name = props.name;
    this.description = props.description;
    this.authorId = props.authorId;
    this.coverId = props.coverId ?? undefined;
  }
}
