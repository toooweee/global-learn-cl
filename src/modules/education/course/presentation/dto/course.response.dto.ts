import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CourseScope, StepType } from '@generated/client';
import { BaseResponseDto } from '@/libs/api/dto/base.response.dto';

export class StepProgressDto {
  @ApiProperty() stepId: string;
  @ApiProperty() completedAt: Date;

  constructor(props: StepProgressDto) {
    this.stepId = props.stepId;
    this.completedAt = props.completedAt;
  }
}

export class StepResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty() position: number;
  @ApiProperty({ enum: StepType }) type: StepType;
  @ApiPropertyOptional() lessonId?: string;
  @ApiPropertyOptional() lessonContent?: string;
  @ApiPropertyOptional() testId?: string;
  @ApiProperty() isCompleted: boolean;

  constructor(props: {
    id: string;
    name: string;
    position: number;
    type: StepType;
    lessonId?: string;
    lessonContent?: string;
    testId?: string;
    isCompleted?: boolean;
  }) {
    this.id = props.id;
    this.name = props.name;
    this.position = props.position;
    this.type = props.type;
    this.lessonId = props.lessonId;
    this.lessonContent = props.lessonContent;
    this.testId = props.testId;
    this.isCompleted = props.isCompleted ?? false;
  }
}

export class ModuleResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty() position: number;
  @ApiProperty({ type: [StepResponseDto] }) steps: StepResponseDto[];
  @ApiProperty() completedSteps: number;
  @ApiProperty() totalSteps: number;

  constructor(props: {
    id: string;
    name: string;
    position: number;
    steps: StepResponseDto[];
  }) {
    this.id = props.id;
    this.name = props.name;
    this.position = props.position;
    this.steps = props.steps;
    this.totalSteps = props.steps.length;
    this.completedSteps = props.steps.filter((s) => s.isCompleted).length;
  }
}

export class CourseScopeDto {
  @ApiProperty({ enum: CourseScope }) scope: CourseScope;
  @ApiPropertyOptional() departmentId?: string;
  @ApiPropertyOptional() departmentName?: string;
  @ApiPropertyOptional() divisionId?: string;
  @ApiPropertyOptional() divisionName?: string;

  constructor(props: CourseScopeDto) {
    Object.assign(this, props);
  }
}

export class EnrollmentProgressDto {
  @ApiProperty() enrollmentId: string;
  @ApiProperty() status: string;
  @ApiProperty() completedSteps: number;
  @ApiProperty() totalSteps: number;
  @ApiProperty() completionRate: number;
  @ApiPropertyOptional() completedAt?: Date;

  constructor(props: EnrollmentProgressDto) {
    Object.assign(this, props);
  }
}

export class CourseResponseDto extends BaseResponseDto {
  @ApiProperty() name: string;
  @ApiProperty() description: string;
  @ApiProperty() authorId: string;
  @ApiPropertyOptional() coverId?: string;
  @ApiProperty({ type: CourseScopeDto }) scopeInfo: CourseScopeDto;
  @ApiProperty({ type: [ModuleResponseDto] }) modules: ModuleResponseDto[];
  @ApiProperty() totalSteps: number;
  @ApiProperty() completedSteps: number;
  @ApiPropertyOptional({ type: EnrollmentProgressDto })
  enrollment?: EnrollmentProgressDto;

  constructor(props: {
    id: string;
    createdAt: Date;
    updatedAt?: Date;
    name: string;
    description: string;
    authorId: string;
    coverId?: string | null;
    scopeInfo: CourseScopeDto;
    modules: ModuleResponseDto[];
    enrollment?: EnrollmentProgressDto;
  }) {
    super(props);
    this.name = props.name;
    this.description = props.description;
    this.authorId = props.authorId;
    this.coverId = props.coverId ?? undefined;
    this.scopeInfo = props.scopeInfo;
    this.modules = props.modules;
    this.totalSteps = props.modules.reduce((acc, m) => acc + m.totalSteps, 0);
    this.completedSteps = props.modules.reduce(
      (acc, m) => acc + m.completedSteps,
      0,
    );
    this.enrollment = props.enrollment;
  }
}

export class CourseSummaryResponseDto extends BaseResponseDto {
  @ApiProperty() name: string;
  @ApiProperty() description: string;
  @ApiProperty() authorId: string;
  @ApiPropertyOptional() coverId?: string;
  @ApiProperty({ type: CourseScopeDto }) scopeInfo: CourseScopeDto;
  @ApiProperty() moduleCount: number;
  @ApiProperty() isArchived: boolean;
  @ApiPropertyOptional({ type: EnrollmentProgressDto })
  enrollment?: EnrollmentProgressDto;

  constructor(props: {
    id: string;
    createdAt: Date;
    updatedAt?: Date;
    name: string;
    description: string;
    authorId: string;
    coverId?: string | null;
    isArchived: boolean;
    scopeInfo: CourseScopeDto;
    moduleCount: number;
    enrollment?: EnrollmentProgressDto;
  }) {
    super(props);
    this.name = props.name;
    this.description = props.description;
    this.authorId = props.authorId;
    this.coverId = props.coverId ?? undefined;
    this.isArchived = props.isArchived;
    this.scopeInfo = props.scopeInfo;
    this.moduleCount = props.moduleCount;
    this.enrollment = props.enrollment;
  }
}
