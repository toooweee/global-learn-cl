export interface TestAttemptAnswerProps {
  id: string;
  questionId: string;
  answerId: string;
  option: string;
  createdAt: Date;
}

export interface TestAttemptProps {
  testId: string;
  employeeId: string;
  endedAt?: Date;
  answers: TestAttemptAnswerProps[];
  createdAt: Date;
}

export interface CreateTestAttemptProps {
  testId: string;
  employeeId: string;
}
