export interface TestDefinitionProps {
  name: string;
  passingPercent: number;
  createdAt: Date;
  updatedAt?: Date;
}

export interface CreateTestDefinitionProps {
  name: string;
  passingPercent?: number;
}

export interface CourseAnswerProps {
  id: string;
  answer: string;
  isCorrect: boolean;
}

export interface CourseQuestionProps {
  courseId: string;
  moduleId?: string;
  question: string;
  answers: CourseAnswerProps[];
  createdAt: Date;
  updatedAt?: Date;
}

export interface CreateCourseQuestionProps {
  courseId: string;
  moduleId?: string;
  question: string;
  answers: { answer: string; isCorrect: boolean }[];
}
